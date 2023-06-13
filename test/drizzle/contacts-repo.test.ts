import { describe, expect, it } from "vitest";
import setupAndGetDbForTesting, {
  getRandomPhoneNumber,
  getRandomEmail,
} from ".";
import { DrizzleContactsRepo } from "../../src/drizzle/contacts";
import { contacts } from "../../src/drizzle/schema";
import { ContactsRepo } from "../../src/contacts";

describe.concurrent("drizzle contacts repo", async () => {
  const db = await setupAndGetDbForTesting();
  const contactsRepo: ContactsRepo = new DrizzleContactsRepo(db);

  describe.concurrent("getLinkedContactsByPhoneNumber", () => {
    describe.concurrent("should return empty response", () => {
      it("when no linked contact exists", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const resp = await contactsRepo.getLinkedContactsByPhoneNumber(
          phoneNumber
        );

        expect(resp).toMatchObject({ primary: undefined, secondary: [] });
      });
    });

    describe.concurrent("should return linked contacts", () => {
      it("when linking to a primary contact", async () => {
        const primaryPhoneNumber = getRandomPhoneNumber();
        const secondaryPhoneNumber = getRandomPhoneNumber();
        const email = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: email,
            phoneNumber: primaryPhoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: email,
            phoneNumber: secondaryPhoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContactsByPhoneNumber(
          primaryPhoneNumber
        );

        expect(resp.primary).toMatchObject({
          id: primaryId,
          email: email,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: email,
          phoneNumber: secondaryPhoneNumber,
          linkedId: primaryId,
        });
      });

      it("when linking to a secondary contact", async () => {
        const primaryPhoneNumber = getRandomPhoneNumber();
        const secondaryPhoneNumber = getRandomPhoneNumber();
        const email = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: email,
            phoneNumber: primaryPhoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: email,
            phoneNumber: secondaryPhoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContactsByPhoneNumber(
          secondaryPhoneNumber
        );

        expect(resp.primary).toMatchObject({
          id: primaryId,
          email: email,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: email,
          phoneNumber: secondaryPhoneNumber,
          linkedId: primaryId,
        });
      });
    });
  });

  describe.concurrent("getLinkedContactsByEmail", () => {
    describe.concurrent("should return empty response", () => {
      it("when no linked contact exists", async () => {
        const email = getRandomEmail();
        const resp = await contactsRepo.getLinkedContactsByEmail(email);

        expect(resp).toMatchObject({ primary: undefined, secondary: [] });
      });
    });

    describe.concurrent("should return linked contacts", () => {
      it("when linking to a primary contact", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const primaryEmail = getRandomEmail();
        const secondaryEmail = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: primaryEmail,
            phoneNumber: phoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: secondaryEmail,
            phoneNumber: phoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContactsByEmail(primaryEmail);

        expect(resp.primary).toMatchObject({
          id: primaryId,
          email: primaryEmail,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: secondaryEmail,
          phoneNumber: phoneNumber,
          linkedId: primaryId,
        });
      });

      it("when linking to a secondary contact", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const primaryEmail = getRandomEmail();
        const secondaryEmail = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: primaryEmail,
            phoneNumber: phoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: secondaryEmail,
            phoneNumber: phoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContactsByEmail(
          secondaryEmail
        );

        expect(resp.primary).toMatchObject({
          id: primaryId,
          email: primaryEmail,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: secondaryEmail,
          phoneNumber: phoneNumber,
          linkedId: primaryId,
        });
      });
    });
  });

  describe.concurrent("getLinkedContacts", () => {
    describe.concurrent("should return empty response", () => {
      it("when no linked contact exists", async () => {
        const email = getRandomEmail();
        const phoneNumber = getRandomPhoneNumber();
        const resp = await contactsRepo.getLinkedContacts(email, phoneNumber);

        expect(resp).toMatchObject({ primary: [], secondary: [] });
      });
    });

    describe.concurrent("should return linked contacs", () => {
      it("when linking to primary contact by email", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const primaryEmail = getRandomEmail();
        const secondaryEmail = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: primaryEmail,
            phoneNumber: phoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: secondaryEmail,
            phoneNumber: phoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(
          primaryEmail,
          getRandomPhoneNumber()
        );

        expect(resp.primary).toHaveLength(1);
        expect(resp.primary[0]).toMatchObject({
          id: primaryId,
          email: primaryEmail,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: secondaryEmail,
          phoneNumber: phoneNumber,
          linkedId: primaryId,
        });
      });

      it("when linking to secondary contact by email", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const primaryEmail = getRandomEmail();
        const secondaryEmail = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: primaryEmail,
            phoneNumber: phoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: secondaryEmail,
            phoneNumber: phoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(
          secondaryEmail,
          getRandomPhoneNumber()
        );

        expect(resp.primary).toHaveLength(1);
        expect(resp.primary[0]).toMatchObject({
          id: primaryId,
          email: primaryEmail,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: secondaryEmail,
          phoneNumber: phoneNumber,
          linkedId: primaryId,
        });
      });

      it("when linking to primary contact by phoneNumber", async () => {
        const primaryPhoneNumber = getRandomPhoneNumber();
        const secondaryPhoneNumber = getRandomPhoneNumber();
        const email = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: email,
            phoneNumber: primaryPhoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: email,
            phoneNumber: secondaryPhoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(
          getRandomEmail(),
          primaryPhoneNumber
        );

        expect(resp.primary).toHaveLength(1);
        expect(resp.primary[0]).toMatchObject({
          id: primaryId,
          email: email,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: email,
          phoneNumber: secondaryPhoneNumber,
          linkedId: primaryId,
        });
      });

      it("when linking to secondary contact by phoneNumber", async () => {
        const primaryPhoneNumber = getRandomPhoneNumber();
        const secondaryPhoneNumber = getRandomPhoneNumber();
        const email = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: email,
            phoneNumber: primaryPhoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: email,
            phoneNumber: secondaryPhoneNumber,
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(
          getRandomEmail(),
          secondaryPhoneNumber
        );

        expect(resp.primary).toHaveLength(1);
        expect(resp.primary[0]).toMatchObject({
          id: primaryId,
          email: email,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(1);
        expect(resp.secondary[0]).toMatchObject({
          id: secondaryId,
          linkPrecedence: "secondary",
          email: email,
          phoneNumber: secondaryPhoneNumber,
          linkedId: primaryId,
        });
      });

      it("when both email and phoneNumber link to the same cluster", async () => {
        const primaryPhoneNumber = getRandomPhoneNumber();
        const primaryEmail = getRandomEmail();

        const secondaryPhoneNumber = getRandomPhoneNumber();
        const secondaryEmail = getRandomEmail();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "primary",
            email: primaryEmail,
            phoneNumber: primaryPhoneNumber,
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId1 }, { id: secondaryId2 }] = await db
          .insert(contacts)
          .values([
            {
              linkPrecedence: "secondary",
              email: primaryEmail,
              phoneNumber: secondaryPhoneNumber,
              linkedId: primaryId,
            },
            {
              linkPrecedence: "secondary",
              email: secondaryEmail,
              phoneNumber: primaryPhoneNumber,
              linkedId: primaryId,
            },
          ])
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(
          secondaryEmail,
          secondaryPhoneNumber
        );

        expect(resp.primary).toHaveLength(1);
        expect(resp.primary[0]).toMatchObject({
          id: primaryId,
          email: primaryEmail,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });

        expect(resp.secondary).toHaveLength(2);

        expect(resp.secondary).toContainEqual(
          expect.objectContaining({
            id: secondaryId1,
            linkPrecedence: "secondary",
            email: primaryEmail,
            phoneNumber: secondaryPhoneNumber,
            linkedId: primaryId,
          })
        );

        expect(resp.secondary).toContainEqual(
          expect.objectContaining({
            id: secondaryId2,
            linkPrecedence: "secondary",
            email: secondaryEmail,
            phoneNumber: primaryPhoneNumber,
            linkedId: primaryId,
          })
        );
      });

      it("when both email and phoneNumber link to the different cluster", async () => {
        const primaryPhoneNumber1 = getRandomPhoneNumber();
        const primaryEmail1 = getRandomEmail();

        const primaryPhoneNumber2 = getRandomPhoneNumber();

        const email = getRandomEmail();
        const phoneNumber = getRandomPhoneNumber();

        const [{ id: primaryId1 }, { id: primaryId2 }] = await db
          .insert(contacts)
          .values([
            {
              linkPrecedence: "primary",
              email: primaryEmail1,
              phoneNumber: primaryPhoneNumber1,
            },
            {
              linkPrecedence: "primary",
              email: email,
              phoneNumber: primaryPhoneNumber2,
            },
          ])
          .returning({ id: contacts.id });

        const [{ id: secondaryId1 }] = await db
          .insert(contacts)
          .values({
            linkPrecedence: "secondary",
            email: primaryEmail1,
            phoneNumber: phoneNumber,
            linkedId: primaryId1,
          })
          .returning({ id: contacts.id });

        const resp = await contactsRepo.getLinkedContacts(email, phoneNumber);

        expect(resp.primary).toHaveLength(2);
        expect(resp.primary).toContainEqual(
          expect.objectContaining({
            id: primaryId1,
            email: primaryEmail1,
            phoneNumber: primaryPhoneNumber1,
            linkPrecedence: "primary",
          })
        );

        expect(resp.primary).toContainEqual(
          expect.objectContaining({
            id: primaryId2,
            linkPrecedence: "primary",
            email: email,
            phoneNumber: primaryPhoneNumber2,
          })
        );

        expect(resp.secondary).toHaveLength(1);

        expect(resp.secondary).toContainEqual(
          expect.objectContaining({
            id: secondaryId1,
            linkPrecedence: "secondary",
            email: primaryEmail1,
            phoneNumber: phoneNumber,
            linkedId: primaryId1,
          })
        );
      });
    });
  });
});
