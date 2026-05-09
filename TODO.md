# TODO: Fix employee contract service attachment upload

- [ ] Update `src/service/contractService.ts` to support `attachment?: File | null` via `FormData` (using `data` Blob JSON + optional `attachment` file).
- [ ] Align `ContractApiPayload` in `contractService.ts` with the required shape (add `attachment?: File | null`).
- [ ] Modify `create` and `update` in `contractService.ts` to send multipart body when an attachment file is present.
- [ ] Ensure no breaking changes for existing calls that only send `attachmentUrl`.
- [ ] Run TypeScript build/lint (or test command) to verify compilation.

