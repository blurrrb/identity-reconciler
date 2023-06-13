import { afterEach, describe, expect, it } from "vitest";
import { mock, mockClear } from "vitest-mock-extended";
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
        await this.linkContactsUnitOfWork.linkContacts(email, phoneNumber)
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

if (import.meta.vitest) {
  describe("reconciliation service", () => {
    const mockUow = mock<LinkContactsUnitOfWork>();
    const reconciliationService = new ReconciliationService(mockUow);

    describe("reconcile links", () => {
      const email = "some-email@asdf.com";
      const phoneNumber = "+919999999999";
      const contact: Contact = {
        id: 1,
        email: email,
        phoneNumber: phoneNumber,
        linkPrecedence: "primary",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const linkingResponse: LinkingResponse = {
        primary: contact,
        secondary: [],
      };

      afterEach(() => mockClear(mockUow));

      it("should invoke linkContactsUnitOfWork.linkContacts when both email and phoneNumber are defined", async () => {
        await mockUow.linkContacts
          .calledWith(email, phoneNumber)
          .mockReturnValue(new Promise((r) => r(linkingResponse)));

        expect(
          await reconciliationService.reconcileLinks(
            contact.email,
            contact.phoneNumber
          )
        ).toMatchInlineSnapshot(`
          {
            "emails": [
              "some-email@asdf.com",
            ],
            "phoneNumbers": [
              "+919999999999",
            ],
            "primaryContatctId": 1,
            "secondaryContactIds": [],
          }
        `);
        expect(mockUow.linkContacts).toHaveBeenCalledWith(email, phoneNumber);
        expect(mockUow.linkContactsByEmail).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByPhoneNumber).not.toHaveBeenCalled();
      });

      it("should invoke linkContactsUnitOfWork.linkContactsWithEmail when only email is defined", async () => {
        await mockUow.linkContactsByEmail
          .calledWith(email)
          .mockReturnValue(new Promise((r) => r(linkingResponse)));

        expect(
          await reconciliationService.reconcileLinks(contact.email, undefined)
        ).toMatchInlineSnapshot(`
          {
            "emails": [
              "some-email@asdf.com",
            ],
            "phoneNumbers": [
              "+919999999999",
            ],
            "primaryContatctId": 1,
            "secondaryContactIds": [],
          }
        `);
        expect(mockUow.linkContactsByEmail).toHaveBeenCalledWith(email);
        expect(mockUow.linkContacts).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByPhoneNumber).not.toHaveBeenCalled();
      });

      it("should invoke linkContactsUnitOfWork.linkContactsWithPhoneNumber when only email is defined", async () => {
        await mockUow.linkContactsByPhoneNumber
          .calledWith(phoneNumber)
          .mockReturnValue(new Promise((r) => r(linkingResponse)));

        expect(
          await reconciliationService.reconcileLinks(undefined, phoneNumber)
        ).toMatchInlineSnapshot(`
          {
            "emails": [
              "some-email@asdf.com",
            ],
            "phoneNumbers": [
              "+919999999999",
            ],
            "primaryContatctId": 1,
            "secondaryContactIds": [],
          }
        `);
        expect(mockUow.linkContacts).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByEmail).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByPhoneNumber).toHaveBeenCalledWith(
          phoneNumber
        );
      });

      it("should throw error when neither email nor phoneNumber are defined", async () => {
        expect(async () => {
          await reconciliationService.reconcileLinks(undefined, undefined);
        }).rejects.toThrowError(ErrInvalidReconciliationRequest);

        expect(mockUow.linkContacts).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByEmail).not.toHaveBeenCalled();
        expect(mockUow.linkContactsByPhoneNumber).not.toHaveBeenCalled();
      });
    });
  });
}
