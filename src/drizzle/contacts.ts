import { and, eq, exists, or } from "drizzle-orm";
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
    return this.getLinkedContactsByPhoneNumberFromDB(this.db, phoneNumber);
  }

  async getLinkedContactsByPhoneNumberFromDB(
    db: DB,
    phoneNumber: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }> {
    const { subQuery, filterClause } = this._linkedContactsByPhoneNumberQuery(
      db,
      phoneNumber
    );

    const fetchedContacts = await db
      .with(subQuery)
      .select()
      .from(contacts)
      .where(filterClause);

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const primaryContact =
      primaryContacts.length !== 0 ? primaryContacts[0] : undefined;

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return { primary: primaryContact, secondary: secondaryContacts };
  }

  _linkedContactsByPhoneNumberQuery(db: DB, phoneNumber: string) {
    const baseSubQuery = db
      .select()
      .from(contacts)
      .where(eq(contacts.phoneNumber, phoneNumber));

    const subQuery = db.$with("phone_number_sub_query").as(baseSubQuery);

    const filterClause = and(
      exists(baseSubQuery),
      or(
        and(
          eq(subQuery.linkPrecedence, "primary"),
          or(eq(contacts.id, subQuery.id), eq(contacts.linkedId, subQuery.id))
        ),
        and(
          eq(subQuery.linkPrecedence, "secondary"),
          or(
            eq(contacts.id, subQuery.linkedId),
            eq(contacts.linkedId, subQuery.linkedId)
          )
        )
      )
    );

    return { subQuery, filterClause };
  }

  async getLinkedContactsByPhoneNumberForUpdateFromDB(
    db: DB,
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]> {
    const { subQuery, filterClause } = this._linkedContactsByPhoneNumberQuery(
      db,
      phoneNumber
    );

    const fetchedContacts = await db
      .with(subQuery)
      .select()
      .from(contacts)
      .where(filterClause)
      .for("update");

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return [primaryContacts, secondaryContacts];
  }

  async getLinkedContactsByEmail(
    email: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }> {
    return this.getLinkedContactsByEmailFromDB(this.db, email);
  }

  async getLinkedContactsByEmailFromDB(
    db: DB,
    email: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }> {
    const { subQuery, filterClause } = this._linkedContactsByEmailQuery(
      db,
      email
    );

    const fetchedContacts = await db
      .with(subQuery)
      .select()
      .from(contacts)
      .where(filterClause);

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const primaryContact =
      primaryContacts.length !== 0 ? primaryContacts[0] : undefined;

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return { primary: primaryContact, secondary: secondaryContacts };
  }

  _linkedContactsByEmailQuery(db: DB, email: string) {
    const baseSubQuery = db
      .select()
      .from(contacts)
      .where(eq(contacts.email, email));

    const subQuery = db.$with("email_sub_query").as(baseSubQuery);

    const filterClause = and(
      exists(baseSubQuery),
      or(
        and(
          eq(subQuery.linkPrecedence, "primary"),
          or(eq(contacts.id, subQuery.id), eq(contacts.linkedId, subQuery.id))
        ),
        and(
          eq(subQuery.linkPrecedence, "secondary"),
          or(
            eq(contacts.id, subQuery.linkedId),
            eq(contacts.linkedId, subQuery.linkedId)
          )
        )
      )
    );

    return { subQuery, filterClause };
  }

  async getLinkedContactsByEmailForUpdateFromDB(
    db: DB,
    email: string
  ): Promise<[Contact[], Contact[]]> {
    const { subQuery, filterClause } = this._linkedContactsByEmailQuery(
      db,
      email
    );

    const fetchedContacts = await db
      .with(subQuery)
      .select()
      .from(contacts)
      .where(filterClause)
      .for("update");

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return [primaryContacts, secondaryContacts];
  }

  async getLinkedContacts(
    email: string,
    phoneNumber: string
  ): Promise<{ primary: Contact[]; secondary: Contact[] }> {
    return this.getLinkedContactsFromDB(this.db, email, phoneNumber);
  }

  async getLinkedContactsFromDB(
    db: DB,
    email: string,
    phoneNumber: string
  ): Promise<{ primary: Contact[]; secondary: Contact[] }> {
    const { subQuery: emailSubQuery, filterClause: emailFilterClause } =
      this._linkedContactsByEmailQuery(db, email);

    const {
      subQuery: phoneNumberSubQuery,
      filterClause: phoneNumberFilterClause,
    } = this._linkedContactsByPhoneNumberQuery(db, phoneNumber);

    const fetchedContacts = await db
      .with(emailSubQuery, phoneNumberSubQuery)
      .select()
      .from(contacts)
      .where(or(emailFilterClause, phoneNumberFilterClause));

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return { primary: primaryContacts, secondary: secondaryContacts };
  }

  async getLinkedContactsForUpdateFromDB(
    db: DB,
    email: string,
    phoneNumber: string
  ): Promise<{ primary: Contact[]; secondary: Contact[] }> {
    const { subQuery: emailSubQuery, filterClause: emailFilterClause } =
      this._linkedContactsByEmailQuery(db, email);

    const {
      subQuery: phoneNumberSubQuery,
      filterClause: phoneNumberFilterClause,
    } = this._linkedContactsByPhoneNumberQuery(db, phoneNumber);

    const fetchedContacts = await db
      .with(emailSubQuery, phoneNumberSubQuery)
      .select()
      .from(contacts)
      .where(or(emailFilterClause, phoneNumberFilterClause))
      .for("update");

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return { primary: primaryContacts, secondary: secondaryContacts };
  }

  async createContact(contact: Contact): Promise<Contact> {
    return this.createContactInDB(this.db, contact);
  }

  async createContactInDB(db: DB, contact: NewContact): Promise<Contact> {
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

    return this.mapContact(insertedContact[0]);
  }

  async linkToNewPrimary(newPrimary: Contact, contact: Contact): Promise<void> {
    return this.linkToNewPrimaryInDB(this.db, newPrimary, contact);
  }

  async linkToNewPrimaryInDB(
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

    await this.db
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

  mapContact(obj: schemaContact): Contact {
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
}

export class DrizzleLinkContactsUnitOfWork implements LinkContactsUnitOfWork {
  db: DB;
  drizzleContactsRepo: DrizzleContactsRepo;

  constructor(db: DB, drizzleContactsRepo: DrizzleContactsRepo) {
    this.db = db;
    this.drizzleContactsRepo = drizzleContactsRepo;
  }

  async linkContacts(
    email: string,
    phoneNumber: string
  ): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } =
        await this.drizzleContactsRepo.getLinkedContactsForUpdateFromDB(
          tx,
          email,
          phoneNumber
        );

      // if primary does not exist, this is an entirely new contact. save it
      if (primary.length === 0) {
        const insertedContact =
          await this.drizzleContactsRepo.createContactInDB(tx, {
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

        this.drizzleContactsRepo.linkToNewPrimaryInDB(tx, older, younger);

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
        this._containsBothEmailAndPhone(
          primary[0],
          secondary,
          email,
          phoneNumber
        )
      ) {
        // no need to do anything, both exist
        return {
          primary: primary[0],
          secondary,
        };
      }

      // one of email or phoneNumber do not exist, create new and link others to new contact
      const insertedContact = await this.drizzleContactsRepo.createContactInDB(
        tx,
        {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        }
      );

      await this.drizzleContactsRepo.linkToNewPrimaryInDB(
        tx,
        insertedContact,
        primary[0]
      );

      primary[0].linkPrecedence = "secondary";
      primary[0].linkedId = insertedContact.id;

      secondary.push(primary[0]);

      return {
        primary: insertedContact,
        secondary,
      };
    });
  }

  _containsBothEmailAndPhone(
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

  async linkContactsByEmail(email: string): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } =
        await this.drizzleContactsRepo.getLinkedContactsByEmailFromDB(
          tx,
          email
        );

      // if primary exists, this means that the email already exists in our db and we don not need to do any updates
      if (primary) {
        return {
          primary,
          secondary,
        };
      }

      // if primary does not exist, this is an entirely new contact. save it
      const insertedContact = await this.drizzleContactsRepo.createContactInDB(
        tx,
        {
          email,
          linkPrecedence: "primary",
        }
      );

      return { primary: insertedContact, secondary: [] };
    });
  }

  async linkContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<LinkingResponse> {
    return await this.db.transaction(async (tx) => {
      const { primary, secondary } =
        await this.drizzleContactsRepo.getLinkedContactsByPhoneNumberFromDB(
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
      const insertedContact = await this.drizzleContactsRepo.createContactInDB(
        tx,
        {
          phoneNumber,
          linkPrecedence: "primary",
        }
      );

      return { primary: insertedContact, secondary: [] };
    });
  }
}
