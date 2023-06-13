import { describe, it, expect } from "vitest";
import setupAndGetDbForTesting, {
  getRandomEmail,
  getRandomPhoneNumber,
} from ".";
import {
  DrizzleContactsRepo,
  DrizzleLinkContactsUnitOfWork,
} from "../../src/drizzle/contacts";
import { LinkContactsUnitOfWork } from "../../src/contacts";
import { contacts } from "../../src/drizzle/schema";
import exp from "constants";

describe.concurrent("drizzle link contacts unit of work", async () => {
  const db = await setupAndGetDbForTesting();
  const uow: LinkContactsUnitOfWork = new DrizzleLinkContactsUnitOfWork(db);

  describe.concurrent("linkContactsByEmail", () => {
    describe.concurrent("should create new contact", () => {
      it("when no linked contacts exist", async () => {
        const email = getRandomEmail();
        const { primary, secondary } = await uow.linkContactsByEmail(email);

        expect(primary).toMatchObject({
          linkPrecedence: "primary",
          email: email,
          phoneNumber: undefined,
        });

        expect(secondary).toHaveLength(0);
      });
    });

    describe.concurrent("should not create any new contact", () => {
      it("when linked contact exists", async () => {
        const email = getRandomEmail();

        const [{ id: originalId }] = await db
          .insert(contacts)
          .values({
            email,
            phoneNumber: getRandomPhoneNumber(),
            linkPrecedence: "primary",
          })
          .returning({ id: contacts.id });

        const { primary, secondary } = await uow.linkContactsByEmail(email);

        expect(primary).toMatchObject({
          id: originalId,
          email,
          linkPrecedence: "primary",
        });
        expect(secondary).toHaveLength(0);
      });
    });
  });

  describe.concurrent("linkContactsByPhoneNumber", () => {
    describe.concurrent("should create new contact", () => {
      it("when no linked contacts exist", async () => {
        const phoneNumber = getRandomPhoneNumber();
        const { primary, secondary } = await uow.linkContactsByPhoneNumber(
          phoneNumber
        );

        expect(primary).toMatchObject({
          linkPrecedence: "primary",
          email: undefined,
          phoneNumber: phoneNumber,
        });

        expect(secondary).toHaveLength(0);
      });
    });

    describe.concurrent("should not create any new contact", () => {
      it("when linked contact exists", async () => {
        const phoneNumber = getRandomPhoneNumber();

        const [{ id: originalId }] = await db
          .insert(contacts)
          .values({
            email: getRandomEmail(),
            phoneNumber: phoneNumber,
            linkPrecedence: "primary",
          })
          .returning({ id: contacts.id });

        const { primary, secondary } = await uow.linkContactsByPhoneNumber(
          phoneNumber
        );

        expect(primary).toMatchObject({
          id: originalId,
          phoneNumber,
          linkPrecedence: "primary",
        });
        expect(secondary).toHaveLength(0);
      });
    });
  });

  describe.concurrent("linkContacts", () => {
    describe.concurrent("should create new contact", () => {
      it("when no linked contacts exist", async () => {
        const email = getRandomEmail();
        const phoneNumber = getRandomPhoneNumber();
        const { primary, secondary } = await uow.linkContacts(
          email,
          phoneNumber
        );

        expect(primary).toMatchObject({
          linkPrecedence: "primary",
          email: email,
          phoneNumber: phoneNumber,
        });

        expect(secondary).toHaveLength(0);
      });

      it("when email is new", async () => {
        const email = getRandomEmail();
        const phoneNumber = getRandomPhoneNumber();

        const [{ id: originalId }] = await db
          .insert(contacts)
          .values({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "primary",
          })
          .returning({ id: contacts.id });

        const newEmail = getRandomEmail();
        const { primary, secondary } = await uow.linkContacts(
          newEmail,
          phoneNumber
        );

        expect(primary).toMatchObject({
          linkPrecedence: "primary",
          email,
          phoneNumber,
          id: originalId,
        });

        expect(secondary).toHaveLength(1);
        expect(secondary[0]).toMatchObject({
          linkPrecedence: "secondary",
          linkedId: originalId,
          email: newEmail,
          phoneNumber,
        });
      });

      it("when phoneNumber is new", async () => {
        const email = getRandomEmail();
        const phoneNumber = getRandomPhoneNumber();

        const [{ id: originalId }] = await db
          .insert(contacts)
          .values({
            email: email,
            phoneNumber: phoneNumber,
            linkPrecedence: "primary",
          })
          .returning({ id: contacts.id });

        const newPhoneNumber = getRandomPhoneNumber();
        const { primary, secondary } = await uow.linkContacts(
          email,
          newPhoneNumber
        );

        expect(primary).toMatchObject({
          linkPrecedence: "primary",
          email,
          phoneNumber,
          id: originalId,
        });

        expect(secondary).toHaveLength(1);
        expect(secondary[0]).toMatchObject({
          linkPrecedence: "secondary",
          linkedId: originalId,
          email: email,
          phoneNumber: newPhoneNumber,
        });
      });
    });

    describe.concurrent("should do nothing", () => {
      it("when both email and phoneNumber belong to same cluster", async () => {
        const email = getRandomEmail();

        const primaryPhoneNumber = getRandomPhoneNumber();
        const secondaryPhoneNumber = getRandomPhoneNumber();

        const [{ id: primaryId }] = await db
          .insert(contacts)
          .values({
            email: email,
            phoneNumber: primaryPhoneNumber,
            linkPrecedence: "primary",
          })
          .returning({ id: contacts.id });

        const [{ id: secondaryId }] = await db
          .insert(contacts)
          .values({
            email: email,
            phoneNumber: secondaryPhoneNumber,
            linkPrecedence: "secondary",
            linkedId: primaryId,
          })
          .returning({ id: contacts.id });

        const { primary, secondary } = await uow.linkContacts(
          email,
          secondaryPhoneNumber
        );

        expect(primary).toMatchObject({
          id: primaryId,
          email: email,
          phoneNumber: primaryPhoneNumber,
          linkPrecedence: "primary",
        });
        expect(secondary).toHaveLength(1);
        expect(secondary[0]).toMatchObject({
          email: email,
          phoneNumber: secondaryPhoneNumber,
          linkPrecedence: "secondary",
          linkedId: primaryId,
        });
      });
    });

    describe.concurrent(
      "should merge clusters and make the older contact primary",
      () => {
        it("when email and phoneNumber belong to different clusters", async () => {
          const email = getRandomEmail();
          const phoneNumber = getRandomPhoneNumber();

          const [{ id: olderId }, { id: youngerId }] = await db
            .insert(contacts)
            .values([
              {
                email: email,
                linkPrecedence: "primary",
                createdAt: new Date("2020-01-01"),
              },
              {
                phoneNumber: phoneNumber,
                linkPrecedence: "primary",
                createdAt: new Date("2022-01-01"),
              },
            ])
            .returning({ id: contacts.id });

          const { primary, secondary } = await uow.linkContacts(
            email,
            phoneNumber
          );

          expect(primary).toMatchObject({
            id: olderId,
            email: email,
            linkPrecedence: "primary",
          });
          expect(secondary).toHaveLength(1);
          expect(secondary[0]).toMatchObject({
            id: youngerId,
            phoneNumber: phoneNumber,
            linkPrecedence: "secondary",
            linkedId: olderId,
          });
        });
      }
    );
  });
});
