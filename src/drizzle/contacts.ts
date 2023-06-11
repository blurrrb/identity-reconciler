import { SQL, eq, inArray, or, sql } from "drizzle-orm";
import {
  Contact,
  ContactsRepo,
  LinkContactsUnitOfWork,
  LinkingResponse,
  NewContact,
} from "../contacts";
import {
  contacts,
  Contact as schemaContact,
  NewContact as schemaNewContact,
} from "./schema";
import { DB } from "./store";

export class DrizzleContactsRepo implements ContactsRepo {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async getLinkedContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }> {
    return getLinkedContactsByPhoneNumber(this.db, phoneNumber);
  }

  async getLinkedContactsByEmail(
    email: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }> {
    return getLinkedContactsByEmail(this.db, email);
  }

  async getLinkedContacts(
    email: string,
    phoneNumber: string
  ): Promise<{ primary: Contact[]; secondary: Contact[] }> {
    return getLinkedContacts(this.db, email, phoneNumber);
  }

  async createContact(contact: Contact): Promise<Contact> {
    return createContact(this.db, contact);
  }

  async linkToNewPrimary(newPrimary: Contact, contact: Contact): Promise<void> {
    return linkToNewPrimary(this.db, newPrimary, contact);
  }
}

export class DrizzleLinkContactsUnitOfWork implements LinkContactsUnitOfWork {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async linkContacts(
    email: string,
    phoneNumber: string
  ): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } = await getLinkedContactsForUpdate(
        tx,
        email,
        phoneNumber
      );

      // if primary does not exist, this is an entirely new contact. save it
      if (primary.length === 0) {
        const insertedContact = await createContact(tx, {
          email,
          linkPrecedence: "primary",
        });

        return { primary: insertedContact, secondary: [] };
      }

      // if 2 primary exist, then both email and phone exist but in different clusters. link them
      if (primary.length === 2) {
        // identify oldest primary
        const [older, younger] =
          primary[0].createdAt >= primary[1].createdAt
            ? [primary[0], primary[1]]
            : [primary[1], primary[0]];

        linkToNewPrimary(tx, older, younger);

        younger.linkPrecedence = "secondary";
        younger.linkedId = older.id;
        secondary.push(younger);

        return {
          primary: older,
          secondary,
        };
      }

      // if one primary exists, both email and phone can belong to the same cluster or one of them does not exist
      if (
        containsBothEmailAndPhone(primary[0], secondary, email, phoneNumber)
      ) {
        // no need to do anything, both exist
        return {
          primary: primary[0],
          secondary,
        };
      }

      // one of email or phoneNumber do not exist, create new and link others to new contact
      const insertedContact = await createContact(tx, {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      });

      await linkToNewPrimary(tx, insertedContact, primary[0]);

      primary[0].linkPrecedence = "secondary";
      primary[0].linkedId = insertedContact.id;

      secondary.push(primary[0]);

      return {
        primary: insertedContact,
        secondary,
      };
    });
  }

  async linkContactsByEmail(email: string): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } = await getLinkedContactsByEmail(tx, email);

      // if primary exists, this means that the email already exists in our db and we dont not need to do any updates
      if (primary) {
        return {
          primary,
          secondary,
        };
      }

      // if primary does not exist, this is an entirely new contact. save it
      const insertedContact = await createContact(tx, {
        email,
        linkPrecedence: "primary",
      });

      return { primary: insertedContact, secondary: [] };
    });
  }

  async linkContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } = await getLinkedContactsByPhoneNumber(
        tx,
        phoneNumber
      );

      // if primary exists, this means that the phoneNumber already exists in our db and we don not need to do any updates
      if (primary) {
        return {
          primary,
          secondary,
        };
      }

      // if primary does not exist, this is an entirely new contact. save it
      const insertedContact = await createContact(tx, {
        phoneNumber,
        linkPrecedence: "primary",
      });

      return { primary: insertedContact, secondary: [] };
    });
  }
}

function containsBothEmailAndPhone(
  primary: Contact,
  secondary: Contact[],
  email: string,
  phoneNumber: string
): boolean {
  return (
    (primary.email === email ||
      secondary.filter((c) => c.email === email).length !== 0) &&
    (primary.phoneNumber === phoneNumber ||
      secondary.filter((c) => c.phoneNumber === phoneNumber).length !== 0)
  );
}

async function getLinkedContactsByPhoneNumber(
  db: DB,
  phoneNumber: string
): Promise<{ primary?: Contact; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContactsByPhoneNumber(db, phoneNumber)
  );

  const { primary, secondary } = segregatePrimaryAndSecondary(fetchedContacts);
  const primaryContact = primary.length !== 0 ? primary[0] : undefined;

  return { primary: primaryContact, secondary };
}

async function getLinkedContactsByPhoneNumberForUpdate(
  db: DB,
  phoneNumber: string
): Promise<{ primary?: Contact; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContactsByPhoneNumber(db, phoneNumber)
  ).for("update");

  const { primary, secondary } = segregatePrimaryAndSecondary(fetchedContacts);
  const primaryContact = primary.length !== 0 ? primary[0] : undefined;

  return { primary: primaryContact, secondary };
}

async function getLinkedContactsByEmail(
  db: DB,
  email: string
): Promise<{ primary?: Contact; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContactsByEmail(db, email)
  );

  const { primary, secondary } = segregatePrimaryAndSecondary(fetchedContacts);
  const primaryContact = primary.length !== 0 ? primary[0] : undefined;

  return { primary: primaryContact, secondary };
}

async function getLinkedContactsByEmailForUpdate(
  db: DB,
  email: string,
  phoneNumber: string
): Promise<{ primary?: Contact; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContactsByEmail(db, email)
  ).for("update");

  const { primary, secondary } = segregatePrimaryAndSecondary(fetchedContacts);
  const primaryContact = primary.length !== 0 ? primary[0] : undefined;

  return { primary: primaryContact, secondary };
}

async function getLinkedContacts(
  db: DB,
  email: string,
  phoneNumber: string
): Promise<{ primary: Contact[]; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContacts(db, email, phoneNumber)
  );

  return segregatePrimaryAndSecondary(fetchedContacts);
}

async function getLinkedContactsForUpdate(
  db: DB,
  email: string,
  phoneNumber: string
): Promise<{ primary: Contact[]; secondary: Contact[] }> {
  const fetchedContacts = await getQueryForLinkedContacts(
    db,
    subQueryClauseForLinkedContacts(db, email, phoneNumber)
  ).for("update");

  return segregatePrimaryAndSecondary(fetchedContacts);
}

async function createContact(db: DB, contact: NewContact): Promise<Contact> {
  const now = new Date();
  const contactToInsert: schemaNewContact = {
    email: contact.email,
    phoneNumber: contact.phoneNumber,
    linkPrecedence: contact.linkPrecedence,
    linkedId: contact.linkedId,
    createdAt: now,
    updatedAt: now,
  };
  const insertedContact = await db
    .insert(contacts)
    .values(contactToInsert)
    .returning();

  return mapContact(insertedContact[0]);
}

async function linkToNewPrimary(
  db: DB,
  newPrimary: Contact,
  contact: Contact
): Promise<void> {
  let oldPrimaryId: number;
  switch (contact.linkPrecedence) {
    case "secondary":
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      oldPrimaryId = contact.linkedId!;
      break;
    case "primary":
      oldPrimaryId = contact.id;
      break;
  }

  await db
    .update(contacts)
    .set({
      linkedId: newPrimary.id,
      linkPrecedence: "secondary",
      updatedAt: new Date(),
    })
    .where(
      or(eq(contacts.id, oldPrimaryId), eq(contacts.linkedId, oldPrimaryId))
    );
}

function getQueryForLinkedContacts(
  db: DB,
  subQueryClause: SQL<unknown> | undefined
) {
  const subQuery = db.$with("sq").as(
    db
      .select({
        id: sql<number>`DISTINCT(COALESCE(${contacts.linkedId}, ${contacts.id}))`,
      })
      .from(contacts)
      .where(subQueryClause)
  );

  const selectFromSubQuery = db.select().from(subQuery);

  return db
    .with(subQuery)
    .select()
    .from(contacts)
    .where(
      or(
        inArray(contacts.id, selectFromSubQuery),
        inArray(contacts.linkedId, selectFromSubQuery)
      )
    );
}

function subQueryClauseForLinkedContactsByPhoneNumber(
  db: DB,
  phoneNumber: string
) {
  return eq(contacts.phoneNumber, phoneNumber);
}

function subQueryClauseForLinkedContactsByEmail(db: DB, email: string) {
  return eq(contacts.email, email);
}

function subQueryClauseForLinkedContacts(
  db: DB,
  email: string,
  phoneNumber: string
) {
  return or(eq(contacts.email, email), eq(contacts.phoneNumber, phoneNumber));
}

function segregatePrimaryAndSecondary(contacts: schemaContact[]): {
  primary: Contact[];
  secondary: Contact[];
} {
  const primary: Contact[] = contacts
    .filter((c) => c.linkPrecedence === "primary")
    .map((c) => mapContact(c));

  const secondary: Contact[] = contacts
    .filter((c) => c.linkPrecedence === "secondary")
    .map((c) => mapContact(c));

  return { primary, secondary };
}

function mapContact(obj: schemaContact): Contact {
  return {
    id: obj.id,
    phoneNumber: obj.phoneNumber || undefined,
    email: obj.email || undefined,
    linkPrecedence: obj.linkPrecedence,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    deletedAt: obj.deletedAt || undefined,
  };
}
