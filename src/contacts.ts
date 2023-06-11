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

export interface ContactsRepo {
  getLinkedContactsByPhoneNumber(
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]>;
  getLinkedContactsByEmail(email: string): Promise<[Contact[], Contact[]]>;
  getLinkedContacts(
    email: string,
    phoneNumber: string
  ): Promise<[Contact[], Contact[]]>;
  createContact(contact: Contact): Promise<number>;
  linkToNewPrimary(newPrimary: Contact, contact: Contact): Promise<void>;
}

export type LinkingRequest = {
  email?: string;
  phoneNumber?: string;
};

export type LinkingResponse = {
  primary: Contact;
  secondary: Contact[];
};

export interface LinkContactsUnitOfWork {
  linkContact: (linkingRequest: LinkingRequest) => Promise<LinkingResponse>;
}
