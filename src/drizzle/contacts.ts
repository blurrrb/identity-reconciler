import { NeonDatabase } from "drizzle-orm/neon-serverless";
import { Contact, ContactsRepo } from "../contacts";
import { contacts, Contact as schemaContact, NewContact } from "./schema";
import { and, eq, or } from "drizzle-orm";
export class DrizzleContactsRepo implements ContactsRepo {
  db: NeonDatabase;

  constructor(db: NeonDatabase) {
    this.db = db;
  }

  async getLinkedContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]> {
    return this._getLinkedContactsByPhoneNumber(this.db, phoneNumber);
  }

  async _getLinkedContactsByPhoneNumber(
    db: NeonDatabase,
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

  _linkedContactsByPhoneNumberQuery(db: NeonDatabase, phoneNumber: string) {
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

  async _getLinkedContactsByPhoneNumberForUpdate(
    db: NeonDatabase,
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
    return this._getLinkedContactsByEmail(this.db, email);
  }

  async _getLinkedContactsByEmail(
    db: NeonDatabase,
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

  _linkedContactsByEmailQuery(db: NeonDatabase, email: string) {
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

  async _getLinkedContactsByEmailForUpdate(
    db: NeonDatabase,
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
    return this._getLinkedContacts(this.db, email, phoneNumber);
  }

  async _getLinkedContacts(
    db: NeonDatabase,
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

  async _getLinkedContactsForUpdate(
    db: NeonDatabase,
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
    return this._createContact(this.db, contact);
  }

  async _createContact(db: NeonDatabase, contact: Contact): Promise<number> {
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

  async linkToNewPrimary(
    newPrimary: Contact,
    oldPrimary: Contact
  ): Promise<void> {
    return this._linkToNewPrimary(this.db, newPrimary, oldPrimary);
  }

  async _linkToNewPrimary(
    _db: NeonDatabase,
    _newPrimary: Contact,
    _oldPrimary: Contact
  ): Promise<void> {
    throw new Error("Method not implemented.");
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
