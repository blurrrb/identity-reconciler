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

export type LinkingRequest = {
  email: string;
  phoneNumber: string;
};

export type LinkingResponse = {
  primary: Contact;
  secondary: Contact[];
};

export interface LinkContactsUnitOfWork {
  linkContacts: (linkingRequest: LinkingRequest) => Promise<LinkingResponse>;
  linkContactsByEmail: (email: string) => Promise<LinkingResponse>;
  linkContactsByPhoneNumber: (phoneNumber: string) => Promise<LinkingResponse>;
}
