import { Contact, ContactsRepo } from "../contacts";
import { contacts, Contact as schemaContact, NewContact } from "./schema";
import { and, eq, or } from "drizzle-orm";
import { DB } from "./store";
export class DrizzleContactsRepo implements ContactsRepo {
  db: DB;

  constructor(db: DB) {
    this.db = db;
  }

  async getLinkedContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]> {
    return this.getLinkedContactsByPhoneNumberFromDB(this.db, phoneNumber);
  }

  async getLinkedContactsByPhoneNumberFromDB(
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
      .where(filterClause);

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return [primaryContacts, secondaryContacts];
  }

  _linkedContactsByPhoneNumberQuery(db: DB, phoneNumber: string) {
    const subQuery = db
      .$with("phone_number_sub_query")
      .as(
        db.select().from(contacts).where(eq(contacts.phoneNumber, phoneNumber))
      );

    const filterClause = or(
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
  ): Promise<[Contact[], Contact[]]> {
    return this.getLinkedContactsByEmailFromDB(this.db, email);
  }

  async getLinkedContactsByEmailFromDB(
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
      .where(filterClause);

    const primaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "primary")
      .map((c) => this.mapContact(c));

    const secondaryContacts: Contact[] = fetchedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => this.mapContact(c));

    return [primaryContacts, secondaryContacts];
  }

  _linkedContactsByEmailQuery(db: DB, email: string) {
    const subQuery = db
      .$with("email_sub_query")
      .as(db.select().from(contacts).where(eq(contacts.email, email)));

    const filterClause = or(
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
  ): Promise<[Contact[], Contact[]]> {
    return this.getLinkedContactsFromDB(this.db, email, phoneNumber);
  }

  async getLinkedContactsFromDB(
    db: DB,
    email: string,
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]> {
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

    return [primaryContacts, secondaryContacts];
  }

  async getLinkedContactsForUpdateFromDB(
    db: DB,
    email: string,
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]> {
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

    return [primaryContacts, secondaryContacts];
  }

  async createContact(contact: Contact): Promise<number> {
    return this.createContactInDB(this.db, contact);
  }

  async createContactInDB(db: DB, contact: Contact): Promise<number> {
    const contactToInsert: NewContact = {
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      linkPrecedence: contact.linkPrecedence,
      linkedId: contact.linkedId,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
    const [{ insertedId }] = await db
      .insert(contacts)
      .values(contactToInsert)
      .returning({ insertedId: contacts.id });

    return insertedId;
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
