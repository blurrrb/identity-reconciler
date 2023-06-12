import exp from "constants";
import { eq } from "drizzle-orm";

export type Contact = {
  id: number;
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: "secondary" | "primary";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type NewContact = {
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: "secondary" | "primary";
};

export interface ContactsRepo {
  getLinkedContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }>;
  getLinkedContactsByEmail(
    email: string
  ): Promise<{ primary?: Contact; secondary: Contact[] }>;
  getLinkedContacts(
    email: string,
    phoneNumber: string
  ): Promise<{ primary: Contact[]; secondary: Contact[] }>;
  createContact(NewContact: NewContact): Promise<Contact>;
  linkToNewPrimary(newPrimary: Contact, contact: Contact): Promise<void>;
}

export type LinkingResponse = {
  primary: Contact;
  secondary: Contact[];
};

export interface LinkContactsUnitOfWork {
  linkContacts: (
    email: string,
    phoneNumber: string
  ) => Promise<LinkingResponse>;
  linkContactsByEmail: (email: string) => Promise<LinkingResponse>;
  linkContactsByPhoneNumber: (phoneNumber: string) => Promise<LinkingResponse>;
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  describe.concurrent("hello world", () => {
    const HELLO_WORLD = "hello world";
    it("should be equal to hello world", () => {
      expect(HELLO_WORLD).toBe("hello world");
    });

    it("should not be equal to world hello", () => {
      expect(HELLO_WORLD).not.toBe("world hello");
    });

    describe.concurrent("concatenated with aakash", () => {
      const HELLO_WORLD_AAKASH = HELLO_WORLD + " aakash";
      it("should be equal to hello world aakash", () => {
        expect(HELLO_WORLD_AAKASH).toBe("hello world aakash");
      });

      it("should not be equal to world hello", () => {
        expect(HELLO_WORLD_AAKASH).not.toBe("world hello aakash");
      });
    });
  });
}
