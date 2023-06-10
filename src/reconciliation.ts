import { LinkContactsUnitOfWork } from "./contacts";

export class ReconciliationService {
  linkContactsUnitOfWork: LinkContactsUnitOfWork;

  constructor(linkContactsUnitOfWork: LinkContactsUnitOfWork) {
    this.linkContactsUnitOfWork = linkContactsUnitOfWork;
  }
}
