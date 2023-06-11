import { Contact, LinkContactsUnitOfWork, LinkingResponse } from "./contacts";

export type ReconciliationResponse = {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
};

export const ErrInvalidReconciliationRequest = new Error(
  "invalid reconciliation request"
);

export class ReconciliationService {
  linkContactsUnitOfWork: LinkContactsUnitOfWork;

  constructor(linkContactsUnitOfWork: LinkContactsUnitOfWork) {
    this.linkContactsUnitOfWork = linkContactsUnitOfWork;
  }

  async reconcileLinks(
    email?: string,
    phoneNumber?: string
  ): Promise<ReconciliationResponse> {
    if (email && phoneNumber) {
      return formatResponse(
        await this.linkContactsUnitOfWork.linkContacts({ email, phoneNumber })
      );
    }

    if (email) {
      return formatResponse(
        await this.linkContactsUnitOfWork.linkContactsByEmail(email)
      );
    }

    if (phoneNumber) {
      return formatResponse(
        await this.linkContactsUnitOfWork.linkContactsByPhoneNumber(phoneNumber)
      );
    }

    throw ErrInvalidReconciliationRequest;
  }
}

function formatResponse({
  primary,
  secondary,
}: LinkingResponse): ReconciliationResponse {
  const emailSet = new Set<string>();
  const phoneNumberSet = new Set<string>();

  _addToSet(emailSet, phoneNumberSet, primary);

  secondary.forEach((c) => {
    _addToSet(emailSet, phoneNumberSet, c);
  });

  return {
    primaryContatctId: primary.id,
    emails: Array.from(emailSet.values()),
    phoneNumbers: Array.from(phoneNumberSet.values()),
    secondaryContactIds: secondary.map((c) => c.id),
  };
}

function _addToSet(
  emailSet: Set<string>,
  phoneNumberSet: Set<string>,
  contact: Contact
) {
  if (contact.email) {
    emailSet.add(contact.email);
  }

  if (contact.phoneNumber) {
    phoneNumberSet.add(contact.phoneNumber);
  }
}
