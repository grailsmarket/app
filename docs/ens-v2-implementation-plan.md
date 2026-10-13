**ENS V2 resolver and records implementation plan**

Implement the agreed resolver and configuration management experience on `feat/ens-v2`, preserving V1 record editing and integrating the existing registration and migration flows. This plan covers the frontend repository and the database, API, and indexer work that must be coordinated with Tom. The backend entities and endpoints below are proposed contracts for that coordination; their implementation belongs in the corresponding services.

1. **Keep the agreed product behavior as the implementation baseline.**

   | Area                     | Required behavior                                                                                                                                                                                    |
   | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Identity                 | Each authenticated wallet is a unique user. Resolver labels, configuration labels, and registration preferences are personal Grails database data.                                                   |
   | Settings                 | Replace the settings modal with a page containing Profile details, Notifications, Resolvers, and Records.                                                                                            |
   | Resolver management      | Show deployed resolvers and resolvers with current delegated access. Support additional deployments, personal labels, a preferred registration resolver, and permission management where authorized. |
   | Configuration management | Group all known configurations by resolver, including unused configurations. Support personal labels, creation, empty creation with a warning, duplication, editing, and name assignment.            |
   | Configuration detail     | Use a separate page with nested Records and Names navigation. Records is selected by default.                                                                                                        |
   | Names                    | Show explicit links and implicit default usage with distinct badges. Unlinking is labeled Use resolver default.                                                                                      |
   | Record types             | Support addresses, text, contenthash, name, ABI, interface, and raw data. Add advanced fields through Add records. Show populated advanced fields when loading an existing configuration.            |
   | Quick editing            | Keep users in the name modal. Offer editing the current shared configuration, creating a separate configuration for that name, and switching to another configuration in the current resolver.       |
   | V1                       | Preserve the current V1 editor and add a migration banner.                                                                                                                                           |
   | Migration                | Open a separate assistant modal.                                                                                                                                                                     |
   | Registration             | Use the saved preferred resolver for self-registration, otherwise the existing predicted resolver. For another recipient, start with that recipient's predicted resolver and allow an override.      |
   | Batch registration       | One resolver selection applies to every name in the registration operation, including all transaction chunks.                                                                                        |
   | Primary name             | Provide an onchain ENS primary-name flow for the authenticated address.                                                                                                                              |

   Keep resolver addresses and configuration IDs visible in the agreed lists. Use configuration labels, record fields, and clear descriptions of the names affected in editing flows; show additional contract details where they help explain an action.

2. **Establish the contract and repository foundation before adding screens.**

   Pin the ABI and role definitions to the supported deployment on each enabled chain. The implementation checked during design is commit `07e55a056f5b6a9c90119f501bdd05714e67dddd` of ENS contracts-v2. Confirm the configured proxy implementations against that baseline before enabling writes; an upgraded proxy can change supported behavior.

   Keep these invariants in types, transaction builders, and tests:
   - A configuration is identified by chain, resolver address, and positive onchain record ID. IDs are local to their resolver.
   - ID `0` means an absent explicit link. The resolver's default is the positive-ID configuration linked to the root name `0x00`; no editable Configuration 0 should be invented.
   - An empty explicit configuration suppresses the resolver's default bundle. A first write through an unlinked name allocates a new bundle without copying default values.
   - A resolver-internal name link is independent of the name's current registry resolver. Preserve both facts.
   - Bundle setters operate through DNS-encoded names. Use stable internal anchors for app-created configurations and verify their current links before writing.
   - Resolver deployment provenance does not establish current authority. Permissions must be checked for the actual transaction sender.

   These semantics follow the [checked resolver implementation](https://github.com/ensdomains/contracts-v2/blob/07e55a056f5b6a9c90119f501bdd05714e67dddd/contracts/src/resolver/PermissionedResolver.sol) and its [interface](https://github.com/ensdomains/contracts-v2/blob/07e55a056f5b6a9c90119f501bdd05714e67dddd/contracts/src/resolver/interfaces/IPermissionedResolver.sol).

   | Existing integration                                                                                                                                                                                                                                            | Planned change                                                                                                                                                                |
   | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | [Records modal](/Users/janzunec/Documents/GitHub/grails-market/src/components/modal/records/editRecordsModal.tsx) and [record hook](/Users/janzunec/Documents/GitHub/grails-market/src/hooks/records/useEditRecords.ts)                                         | Separate V1 and V2 orchestration, retaining reusable presentation components.                                                                                                 |
   | [V2 utilities](/Users/janzunec/Documents/GitHub/grails-market/src/utils/web3/ensv2.ts)                                                                                                                                                                          | Replace implicit resolver migration with explicit configuration operations. Split growing resolver, permissions, record codec, and transaction concerns into focused modules. |
   | [V2 ABI](/Users/janzunec/Documents/GitHub/grails-market/src/constants/abi/ENSv2.ts)                                                                                                                                                                             | Add all record profiles, links, EAC reads/writes, events, and deployment verification needed by the plan.                                                                     |
   | [Settings modal](/Users/janzunec/Documents/GitHub/grails-market/src/components/modal/settings/settingsModal.tsx)                                                                                                                                                | Move existing email and notification behavior into routed sections.                                                                                                           |
   | [Modal host](/Users/janzunec/Documents/GitHub/grails-market/src/app/modals.tsx) and [settings URL hook](/Users/janzunec/Documents/GitHub/grails-market/src/hooks/useOpenSettingsFromUrl.ts)                                                                     | Route settings entry points to the new page and retain legacy settings-link compatibility.                                                                                    |
   | [Registration orchestration](/Users/janzunec/Documents/GitHub/grails-market/src/components/modal/registration/hooks/use-registration-modal.ts) and [V2 registrar hook](/Users/janzunec/Documents/GitHub/grails-market/src/hooks/registrar/useEnsV2Registrar.ts) | Pass an explicit, persisted resolver through commitment and registration. Complete the currently disabled V2 multi-name execution path.                                       |
   | [Registration state](/Users/janzunec/Documents/GitHub/grails-market/src/state/reducers/registration/index.ts) and [persistence migrations](/Users/janzunec/Documents/GitHub/grails-market/src/state/reducers/index.ts)                                          | Add versioned commitment snapshots and per-name execution progress.                                                                                                           |
   | [Migration modal](/Users/janzunec/Documents/GitHub/grails-market/src/components/modal/migration/migrationModal.tsx) and [migration utilities](/Users/janzunec/Documents/GitHub/grails-market/src/utils/web3/ensMigration.ts)                                    | Extend the existing assistant with destination configuration, record preservation, configured-chain support, and recovery.                                                    |
   | [Metadata client](/Users/janzunec/Documents/GitHub/grails-market/src/api/name/metadata.ts)                                                                                                                                                                      | Retain the existing name metadata response for consumers while adding a lossless typed configuration API.                                                                     |
   | [Bulk record hook](/Users/janzunec/Documents/GitHub/grails-market/src/hooks/records/useBulkEditRecords.ts)                                                                                                                                                      | Route V2 writes through the same explicit operation model and account for shared configurations.                                                                              |

   The current V2 name helper only understands second-level `.eth` names. Add registry-aware name context before enabling subname writes; derive the holding registry and local label instead of sending every operation to ETHRegistry. Public resolution should continue through the Universal Resolver, including custom and inherited resolvers. [ENSv2 application integration](https://docs.ens.domains/ensv2/tutorial-app-developers/).

3. **Agree the normalized database model with the backend.**

   Store onchain facts separately from Grails personalization. Use lossless numeric storage for uint256 identifiers and decimal strings at the JSON boundary. Normalize address comparison while preserving checksummed display values.

   | Proposed entity                 | Identity and essential data                                                                                                                                              |
   | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `ens_resolvers`                 | Chain + address; factory, factory caller/deployer provenance, deployment block/transaction, current implementation, supported family/version, last onchain activity.     |
   | `ens_configurations`            | Chain + resolver + record ID; creation block/transaction, current value count, activity. Retain configurations with zero real-name usage.                                |
   | `ens_configuration_values`      | Configuration + type + discriminator; raw value and typed display representation. Discriminators include text/data key, coin type, ABI content type, and interface ID.   |
   | `ens_resolver_name_links`       | Chain + resolver + node; DNS name bytes, current explicit ID, event position. Store the root link and unlinked state explicitly.                                         |
   | Existing name/registry entities | Holding registry, stable canonical name-entry identity, current token ID, current EAC resource, owner/status/expiry, explicit resolver pointer, namespace relationships. |
   | `ens_role_grants`               | Chain + contract + resource + account; current bitmap and event position. Keep registry and resolver grants separate by contract.                                        |
   | `ens_resource_arguments`        | Contract/resource preimages and role context needed to describe restricted keys, coin types, and other arguments.                                                        |
   | Grails configuration anchors    | Configuration identity + internal DNS anchor + provenance. Treat this as app metadata whose linkage must be verified onchain.                                            |
   | Personal resolver aliases       | Authenticated user/wallet + chain + resolver; label.                                                                                                                     |
   | Personal configuration aliases  | Authenticated user/wallet + chain + resolver + record ID; label.                                                                                                         |
   | Personal resolver preferences   | Authenticated user/wallet + chain; preferred registration resolver.                                                                                                      |
   | Indexer checkpoints/events      | Canonical block hashes, ordered event identity, replay/reorg state, and ingestion completeness.                                                                          |

   Each record value belongs directly to its configuration. Do not add a many-to-many table for sharing identical individual values: sharing happens at the bundle level.

   The default ID is derived from the root link; any cached default-ID column is a projection of that fact. Do not copy the default ID into every unlinked name as if it were an explicit link. Derive effective configuration separately from stored explicit configuration.

   Keep current resolver links after domains change resolvers. Compute active usage by joining the applicable registry/hierarchy state and current resolver links, excluding root/internal anchors and inactive names. Track known inherited-resolver usage separately so the interface can explain count scope. Shared registry namespaces require full-name paths as well as registry entry identities.

   Define populated-record counts by record-type semantics, excluding cleared values. Count each explicit text/data key, address coin type, ABI content type, and interface entry separately; count populated singleton fields once. Do not count derived fallback answers as additional stored records. Define Names as known active full names currently served, with explicit/default and inherited-resolver breakdowns available from the same query.

   Mutable token IDs remain current marketplace data, not permanent foreign keys. The registry's canonical identity is stable; its EAC resource changes across registration lifecycles. [Mutable token IDs](https://docs.ens.domains/ensv2/mutable-token-ids/).

4. **Build resolver discovery and indexing before relying on complete lists.**

   Watch configured factory deployments and registry resolver pointers. Backfill newly discovered instances to deployment and process initialization logs preceding `ProxyDeployed` in its transaction. Distinguish usable proxies from implementation contracts. Track `Linked`, all supported value updates, EAC changes, resource arguments, implementation upgrades, registry resolver/hierarchy changes, and name lifecycle. `ABIUpdated` omits the actual ABI bytes, so retrieve those through an appropriate historical read or transaction decoding. [ENSv2 indexing](https://docs.ens.domains/ensv2/indexing/).

   Indexer acceptance requires deterministic replay, idempotent ingestion, canonical block tracking, and rollback of orphaned events. Expiry-sensitive counts must update when time crosses expiry even without a new event. Deduplicate discoveries and refresh role projections after revocation.

   Do not mistake a live subscription started today for a complete configuration history. Track `indexedThroughBlock`, backfill progress, implementation support, and value-completeness status. An inaccessible historical ABI or unsupported implementation must produce an explicit incomplete state, not a silently empty field.

   Retain raw typed values for copying. Resolved getters can apply address or interface fallback behavior; those answers must not become invented explicitly stored values in a duplicate. Compare record IDs and state at consistent blocks where possible. The [record resolution implementation](https://github.com/ensdomains/contracts-v2/blob/07e55a056f5b6a9c90119f501bdd05714e67dddd/contracts/src/resolver/AbstractRecordResolver.sol) defines these read semantics.

   Resolver discovery must include instances without real domains so newly created and unused configurations appear. Support verified on-demand backfill for compatible resolvers discovered through a supplied address or registry pointer. An arbitrary address remains usable in registration even if Grails cannot manage it as a Permissioned Resolver.

5. **Define the API contract around the screens and transaction requirements.**

   Use the existing authenticated API conventions. The following routes describe responsibilities; finalize spelling and response envelopes with Tom before frontend integration.

   | Proposed API operation                                                | Required response or effect                                                                                                                                              |
   | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `GET /users/me/ens/resolvers?chainId=...&query=...`                   | Deployed/currently accessible resolver union, personal aliases, access summaries, supported capabilities, counts, preference marker, activity, pagination, index status. |
   | `GET /ens/resolvers/:chainId/:address`                                | Resolver facts, deployment provenance, implementation support, root default ID, current-user capabilities.                                                               |
   | `GET /ens/resolvers/:chainId/:address/configurations`                 | All configurations, aliases merged for the authenticated viewer, positive IDs, populated-value counts, explicit/default usage counts, default badge.                     |
   | `GET /ens/resolvers/:chainId/:address/configurations/:recordId`       | Lossless typed records, usable anchor information, completeness, block/version, field capabilities.                                                                      |
   | `GET /ens/resolvers/:chainId/:address/configurations/:recordId/names` | Paginated active known names with explicit/default badges, inherited-resolver status, ownership, and name-assignment capabilities.                                       |
   | `GET /ens/resolvers/:chainId/:address/roles`                          | Accounts, resource scopes, regular/admin grants, effective explanations, and permitted grant/revoke operations.                                                          |
   | `GET /ens/names/:encodedName/context?chainId=...`                     | Name version, holding registry, current and effective resolver, explicit/effective configuration IDs, link mode, registry permissions, resolver compatibility.           |
   | Personal alias and preference mutations under `/users/me/ens/...`     | Save/reset the authenticated wallet's labels and preferred resolver. They do not send chain transactions.                                                                |
   | Verified operation/refresh submission                                 | Accept transaction hashes and expected anchor metadata to prioritize indexing; verify receipts rather than trusting client-reported state.                               |

   Model capabilities as root-wide grants plus argument-specific allowances, including whether an admin can grant an action, instead of a single `canEdit` flag. A user allowed only `avatar` can edit it in every reachable configuration but cannot automatically link names or change registry resolver pointers. [Resolver permissions](https://docs.ens.domains/ensv2/permissioned-resolver/).

   Keep public chain data cacheable independently of personalized fields. Personalized responses and client query keys must include the authenticated wallet; clear or partition them on wallet changes. Label mutation authorization comes from the verified session, not a wallet address supplied in the request body.

   The current name metadata API can use backend joins for supported bundles without changing existing page consumers. General ENS resolution and custom-resolver metadata still require the normal resolution path. Add pagination and bounded payloads for configuration groups, names, and role holders.

6. **Build a shared typed resolver service and transaction executor.**

   Add focused modules under the existing web3 utilities and hooks for resolver discovery/context, role interpretation, record codecs, anchors, operation construction, and transaction execution. Suggested hooks include `useUserResolvers`, `useResolverCapabilities`, `useResolverConfigurations`, `useConfiguration`, `useConfigurationNames`, and mutation-specific hooks. They should share query keys and typed DTOs rather than each reconstructing name state.

   Expand `EnsRecord` into a discriminated union for text, address, contenthash, ABI, interface, name, and data. Use uint256-safe representations for numeric discriminators and raw bytes for binary values. Encode/decode non-EVM addresses and contenthash using validated codecs; do not UTF-8 encode a human address or contenthash URI as its protocol representation. Validate ABI content-type constraints, bytes4 interfaces, implementation addresses, hex payloads, and clearing semantics.

   Separate four permission concerns: record setters, resolver linking, registry resolver assignment, and administration of each permission. Derive the permissions for the actual caller, including supported operator behavior; ownership alone is insufficient. Root and argument grants need distinct handling. Use the resolver's supported grant functions rather than assuming generic `grantRoles` works on every contract. [Enhanced Access Control](https://docs.ens.domains/ensv2/enhanced-access-control/).

   Replace the current failed-write fallback in `planRecordWrite`. An RPC failure, unsupported resolver, or denied setter must never silently become a new resolver deployment and pointer change. Build the operation selected by the user, preflight it, simulate it, then present its concrete effects.

   Use resolver `multicall` for compatible same-contract steps. Preserve the original caller when considering wallet batching, factory deployment, or registry calls. Use sequential transactions as the portable baseline for operations across contracts; do not claim atomicity unless the selected wallet execution path provides it and has been tested.

   The executor should expose review, wallet confirmation, submitted, confirmed, indexer syncing, complete, and recoverable failure states. Persist transaction/receipt progress for multistep work. Distinguish a reverted transaction from a wallet rejection, network failure, pending Safe signatures, or a confirmed transaction waiting for the API. Resume by inspecting chain state instead of repeating successful allocations.

7. **Implement configuration operations with explicit onchain behavior.**

   | User action                                    | Transaction behavior and checks                                                                                                                                                                                                          |
   | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Create a configuration                         | Generate a unique internal DNS anchor, verify it has no explicit link, and write through it. Read the new positive ID from the receipt's `Linked` event. Never predict the next ID.                                                      |
   | Create an empty configuration                  | Submit an authorized setter with its empty value against a fresh anchor. For example, empty text creates the bundle without populated values. Choose a setter the caller can use and show the agreed warning.                            |
   | Edit a configuration                           | Resolve a verified anchor currently linked to the intended ID, check field permissions, and multicall only changed/cleared fields. Show active usage before shared edits.                                                                |
   | Duplicate                                      | Snapshot all indexed raw typed values, verify completeness and destination permissions, then write to a fresh anchor. Keep personal labels separate. Never silently omit unsupported or unauthorized records.                            |
   | Create separately for a name                   | Offer a copy of current values or an explicitly empty starting point. Write through a fresh anchor, then `linkToNode(realName, anchorNode)` in the same resolver multicall when authorized. This avoids guessing the newly allocated ID. |
   | Switch within the current resolver             | Call `linkToRecord(name, chosenId)` with resolver linking authority. The registry pointer stays as it is.                                                                                                                                |
   | Use resolver default                           | Call `linkToRecord(name, 0)`. Indicate the current default configuration or that no default is configured.                                                                                                                               |
   | Initialize defaults                            | Write via root DNS name `0x00`; capture its actual positive ID.                                                                                                                                                                          |
   | Change the default bundle                      | Link the root name to an existing ID. Preview known implicitly affected names; explicit links keep their IDs.                                                                                                                            |
   | Assign a name currently using another resolver | Prepare/verify the destination bundle and internal link, then change the actual holding registry's resolver pointer if authorized. Retain the old resolver's internal link as onchain state.                                             |

   Root linking, first-write allocation, empty values, and `linkToNode` behavior are defined by the [resolver implementation](https://github.com/ensdomains/contracts-v2/blob/07e55a056f5b6a9c90119f501bdd05714e67dddd/contracts/src/resolver/PermissionedResolver.sol).

   An imported bundle may lack an app anchor. Reuse a verified existing linked name, or establish an anchor when the user has linking permission. If neither is possible, show its indexed data read-only with the missing capability explained. Do not write through an anchor that now points to another bundle. For linking-capable callers, consider pinning the anchor to the intended ID in the same multicall as writes; setter-only callers need preflight and post-receipt checks because the existing contract has no general expected-bundle guard.

   Register anchor metadata idempotently against confirmed events. A failed database save must not cause another onchain configuration allocation on retry. Anchor names are internal identifiers, not secrets; their bytes appear onchain.

8. **Move settings into routed pages and retain current profile behavior.**

   Proposed routes are `/settings/profile`, `/settings/notifications`, `/settings/resolvers`, `/settings/records`, and `/settings/records/:chainId/:resolver/:recordId`, with a Names child route. Resolver details can use `/settings/resolvers/:chainId/:resolver`. Use stable identities in routes; personal label changes should not invalidate links.

   Build one settings shell and authenticated-wallet state. Move email verification and notification settings without changing their meaning. Use per-section saves or merge untouched fields correctly so a save in one section cannot overwrite another section's settings. Convert existing settings launchers and `?modal=settings` handling to navigation. Keep loading, reconnect, unavailable-network, empty, and error states explicit.

   Preserve the distinction between private Grails contact email and the public ENS `email` text record. Saving profile contact details must not write resolver records.

   On desktop, use the primary settings sidebar and compact configuration subnavigation. On mobile, collapse navigation into accessible tabs or menus. Preserve return navigation from a name and warn before abandoning unsaved changes. Do not store a user's form draft in another wallet's state.

   Add primary-name editing under Profile details. Resolve the current primary name, normalize the proposed name, verify forward resolution for the target address and scope, build the applicable reverse-registration transaction, and verify reverse resolution after confirmation. Any required forward-record change uses the same shared-configuration review; never silently modify a shared address record.

   Use deployed reverse infrastructure on the configured chain. The documented launch flow still uses V1 reverse infrastructure, while the V2-native multichain registrar is described separately; do not assume the presence of upcoming contracts. [Reverse resolution](https://docs.ens.domains/ensv2/reverse-resolution/).

9. **Build the resolver list, deployment flow, and permissions editor.**

   | Column         | Display and interaction                                                                            |
   | -------------- | -------------------------------------------------------------------------------------------------- |
   | Resolver       | Personal label above shortened address; copy and explorer actions.                                 |
   | Your access    | Full control, Record editor, Limited access, or View only; expand to precise permissions.          |
   | Configurations | Count including unused bundles; open the resolver's configurations.                                |
   | Names          | Known active name count with optional owned count; open the list and explain inherited-name scope. |
   | Last activity  | Last indexed onchain activity, excluding personal alias changes.                                   |

   Show a Preferred for registration marker separately from Default configuration. A deployed resolver with no remaining user permissions remains visible as View only. Show external resolvers clearly without implying their original deployer still controls them. Full control must represent all supported regular and administrative resolver permissions at root, not merely a role count.

   Deploy additional resolvers using fresh factory salts, keeping the existing conventional prediction for the default deployment. Show the predicted address and initial grants in review; confirm the actual deployed address from the receipt. The effective factory caller must match the prediction, including Safe wallets. A different sender cannot deploy at a recipient's conventional predicted address just by granting the recipient roles. [Verifiable Factory](https://docs.ens.domains/ensv2/verifiable-factory/).

   The permissions editor should show wallet, action, scope, and administrative authority. Support root-wide permissions and argument-specific setters, explain that those setter grants affect all configurations, and expose only changes the caller can administer. Refresh capabilities after every grant/revoke. Validate protocol assignee limits and show concrete consequences before revoking the user's last administrative authority. Permit complete handover, including removal of the deployer's remaining root and argument grants.

   Track upgrade authority in access details and compatibility checks. A contract-upgrade deployment UI is not required for record management; enabling arbitrary implementation upgrades would be a separate feature.

10. **Build the configuration list and detail experience.**

    The Records page contains collapsible resolver groups. Each group shows the personal resolver name when set, its address in neutral text in parentheses, and a copy action. Each configuration row shows personal label or Configuration N, populated-record count, active-name count, actual onchain ID, and a Default badge when applicable.

    Make the full row an accessible link. The desktop hover arrow is an additional cue; keyboard and touch navigation must work without it. Paginate or incrementally load large groups without losing the grouping model.

    The Records detail view uses one form shared with the V2 modal. Show unsupported edits as read-only with a specific permission explanation. Add records offers all supported types; advanced fields need appropriate binary/structured editors and validation. Distinguish deleting a stored value from removing a field from an unsaved form.

    Display an impact summary before saving a shared bundle. Include explicit and known default usage. The default badge applies to the bundle's actual ID; if no root bundle exists, present Set up default configuration. Distinguish changing the root link from editing the values of the bundle currently used as default.

    The Names view shows active known users with Explicit and Resolver default badges, plus inherited-resolver details where relevant. Provide assignment to this configuration, switching configurations, and Use resolver default with per-name permissions. An implicitly default name already has no explicit link, so do not offer a meaningless unlink transaction.

    An explicitly linked name using the same bundle as the root remains Explicit. Choosing Use resolver default can leave its current values unchanged while changing its behavior when the root later moves; explain that distinction in the review.

    Include created-but-unused configurations. Contract bundles are not deleted by unlinking, so do not present onchain deletion as an available action. [Configuration lifecycle](https://docs.ens.domains/ensv2/permissioned-resolver/).

11. **Separate V1 and V2 quick editing without duplicating the record UI.**

    Keep a small modal host that loads authoritative name context and renders a V1 editor or the appropriate V2 experience. Extract existing V1 content and transaction behavior before introducing V2 changes. Share field components where useful, but keep V1 authorization and writes independent from V2 resolver roles.

    The V2 header identifies the current resolver, configuration, and whether usage is explicit or default. Offer the agreed actions: Edit current configuration, Create a separate configuration, and Switch configuration within this resolver. Include a link to full configuration settings while keeping the quick flow within the modal.

    Editing default values targets the root-linked bundle or a verified anchor, not an unlinked real name that would allocate a new bundle. Switching options are populated from the current resolver and include Use resolver default. A name owner without resolver setter permissions may still have a registry resolver-management path; explain the distinction and require an explicit destination choice for such a move.

    Preserve the V1 owner/manager interface. V2 must not label the name owner as automatically able to edit every record or represent all delegation as the old manager role. Keep registry-level name controls distinct from resolver-level administration and link the latter to settings.

    A V2 name may still use a legacy or custom resolver. Classify it separately from an unknown/loading state. Keep supported legacy editing adapters or provide a clear compatibility view with an explicit setup/copy path where permitted. Do not render fictitious bundle IDs for custom resolvers or treat an RPC error as proof that the name is V1.

    Update name pages, role entry points, profile editing links, and post-purchase editing to use the host consistently. For existing bulk record editing, group operations by actual bundle and preview all affected names, including names outside the selected list. Reuse the shared-versus-separate choice rather than applying duplicate writes to the same bundle or silently broadening the effect.

12. **Add the registration resolver picker and preserve commitment identity.**

    Implement the agreed combobox in the shared V2 registration review form:
    - Collapsed: Resolver followed by the selected address.
    - Expanded: address input prefilled with the selection.
    - Search accessible resolvers on the active chain by case-insensitive address or personal label.
    - Clicking an option fills its address. No matches means no suggestion list.
    - An empty input shows all accessible resolvers in a bounded scrollable list, loading additional results if needed.
    - Accept a manually entered valid address even when it has no match or Grails cannot manage its resolver type.
    - Keep address validation separate from suggestions. Clearing the field opens discovery; it does not mean an empty address can be committed.
    - Changing the selection affects this registration operation, not the saved preference.

    For self-registration, load the wallet's saved preference or derive today's conventional predicted resolver. For another recipient, derive that recipient's predicted resolver without reading private recipient preferences. Preserve a deliberate override if unrelated form data changes; if the recipient changes while the resolver is still automatic, recompute it. The UI must distinguish an undeployed predicted resolver from a deployed instance; selecting an address alone does not create or populate records.

    Pass the selected resolver into both `makeCommitment` and `register`. Persist an immutable commitment snapshot containing chain, registrar, sender/recipient context, label, duration, resolver, subregistry, secret, and referrer, together with each commitment hash. Changing committed parameters requires an explicit new commitment. A later preference change, reload, or recipient input edit must not mutate an existing commitment. [Registrar commit and reveal parameters](https://docs.ens.domains/ensv2/eth-registrar/).

    Add a Redux persistence migration. For old pending entries lacking the necessary snapshot, reconstruct only from available exact inputs and verify the resulting commitment hash; otherwise explain that a new commitment is required. Do not silently substitute a new resolver for an old commitment. Retain pending work separately when wallets or chains switch.

    V2 bulk registration is currently disabled by `bulkUnavailable`, and the V2 path uses only the first label/duration. Complete a resumable loop over all names using the agreed shared resolver, per-name commitments, maturity checks, prices, and results. Aggregate payment allowance where appropriate and recheck actual prices before execution. Use supported wallet batching only after verifying caller/payment semantics; otherwise submit individual transactions with honest progress. Do not use the protocol's premigration BatchRegistrar as a public registration batch contract. [BatchRegistrar purpose](https://docs.ens.domains/ensv2/eth-registrar/#batchregistrar).

    Preserve successful names when a later item fails, retry only unfinished names, and keep the same resolver across every transaction chunk. Preserve the existing V1 registration behavior.

13. **Extend the separate migration assistant with record-aware preflight and recovery.**

    Add the banner to V1 editor content and reuse the existing migration modal entry point. Its review must cover eligibility, ownership, transfer approvals, fuse restrictions, parent dependencies for subnames, destination resolver/configuration, record-copy completeness, and the actual transactions required. Use configured chain/deployment data instead of the modal's current hardcoded Sepolia client.

    Keep token migration and configuration adoption as distinct steps in the operation model. For eligible editable names, prepare a chosen destination bundle before assigning the name to it. When retaining an existing resolver, verify the actual post-migration resolution path. Locked names can restrict resolver changes, and some public-resolver paths substitute PublicResolverV2; record preservation cannot be promised universally. [Migration behavior](https://docs.ens.domains/ensv2/migration/).

    Capture a lossless source snapshot before any operation that changes resolution. Review incomplete record enumeration or unsupported copy types before submitting irreversible migration steps. Ordinary ENS reads cannot enumerate every arbitrary custom key, so expose coverage and permit additional known keys rather than calling a partial snapshot a complete backup.

    Recheck source values before execution, copy through the common record service, obtain only required approvals, execute migration steps, verify the destination, and refresh name/configuration state. Show transaction hashes and progress separately for approvals, preparation, migration, and any post-migration setup. If the token migration succeeds but configuration setup fails, resume setup; do not attempt to migrate the token again.

    The current helper supports second-level `.eth` names. Add and test eligible locked/detached subname paths with actual parent registries before enabling them, and explain unsupported or ineligible cases. Preserve protocol restrictions instead of offering a resolver switch that cannot succeed. Review affected marketplace token references and prompt users to recreate obsolete listings where needed.

14. **Make state synchronization consistent across settings, names, and transactions.**

    Query keys should include chain, resolver, record ID, and wallet where personalized or permission-dependent. Track the explicit link, root link, and effective bundle separately. Include the read/indexed block in relevant responses so confirmed writes cannot be overwritten by older indexed data.

    After a bundle edit, refresh its detail, counts, activity, names, and every cached name/profile metadata view that depends on it. After a root-link change, refresh implicit-default users. After a resolver pointer change, refresh both old and new usage projections while retaining old raw links. After role changes, refresh controls and discovery membership.

    Coordinate backend invalidation of name metadata and image caches, not only React Query. Avoid synchronously fetching thousands of names after a shared edit; invalidate dependency groups and let consumers refetch. Show Confirmed, syncing when the receipt is final enough for the UI but indexed data has not reached that block.

    Persist resumable operation IDs and transaction progress with wallet/chain boundaries. Do not persist signatures or leak commitment secrets into analytics. Keep confirmed chain state authoritative when an alias write, refresh request, or indexer update fails.

15. **Validate the protocol-sensitive paths and the agreed interaction model.**

    The repository has lint, formatting, typecheck, and build scripts but no established test command in package.json. Add a focused test setup for the new record/permission/transaction logic and browser flows. Use local fixtures or a fork pinned to the supported contracts for repeatable transaction tests; use controlled testnet integration runs for deployed compatibility.

    | Coverage               | Required cases                                                                                                                                                                                          |
    | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Defaults               | No root bundle; root bundle whose ID is not 1; explicit link to the same bundle as default; root switching; unlinking; first write on a default-using name.                                             |
    | Configuration creation | Populated and empty creation, concurrent allocations, receipt-derived IDs, placeholder exclusion, database save failure followed by retry.                                                              |
    | Record integrity       | Every supported type, non-EVM addresses, contenthash round trips, clears, large identifiers, empty values, raw versus resolved fallbacks, complete and incomplete duplication.                          |
    | Permissions            | Root editor, single-key editor, link-only account, admin-only account, domain owner without resolver rights, external resolver access, complete handover, revoked access, changed roles during a draft. |
    | Name assignment        | Same-resolver switch; return to default; cross-resolver assignment; stale old links; inherited resolver; subname holding registry; orphan bundle without a writable anchor.                             |
    | Indexer/API            | Initialization-before-discovery, replays, reorgs, backfill, missing ABI bytes, upgrades, expiry-driven counts, root changes without per-name events, alias isolation.                                   |
    | Quick editor           | All three actions, shared impact display, modal/settings consistency, advanced Add records, unsupported resolver states, and unchanged V1 editing.                                                      |
    | Registration           | Preference/prediction/manual selection, recipient changes, no-match and empty-input suggestions, arbitrary address, persisted commitment, reload, old persisted state, batch partial success and retry. |
    | Migration              | Each supported token path, fuse restrictions, incomplete record snapshots, required approvals, resolver preservation/substitution, partial completion, parent dependencies.                             |
    | Primary name           | Correct reverse path, forward mismatch, wallet authorization, chain scope, and post-confirmation verification.                                                                                          |
    | UX                     | Keyboard combobox/row access, mobile navigation, large lists, unsaved drafts, wallet/chain switches, transaction rejection, Safe pending signatures, and indexer lag.                                   |

    Run formatting on changed files, then lint, typecheck, and the production build. Add meaningful assertions around resulting contract state and visible user behavior. Avoid tests that only mirror component structure or implementation details.

16. **Deliver in dependency order with reviewable completion criteria.**

    | Milestone | Deliverable                                                 | Completion criterion                                                                                                                                                                                 |
    | --------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | A         | Contract baseline, typed domain model, backend/API contract | Supported deployments and operation semantics are pinned; frontend and backend fixtures agree.                                                                                                       |
    | B         | Database/indexer/API and frontend service scaffolding       | Complete resolver/configuration lists, accurate roles/counts/defaults, personalized labels, and index status are available. Frontend can develop against matching fixtures while services are built. |
    | C         | V1 extraction and settings shell                            | V1 behavior is preserved; profile/notification saves and settings entry points work through routes.                                                                                                  |
    | D         | Resolver and configuration management                       | Deploy, label, delegate, create, empty-create, duplicate, edit, link, unlink, and default management work with transaction recovery.                                                                 |
    | E         | V2 quick editing and name integration                       | All three modal actions use the same service as settings; field permissions and shared effects are correct.                                                                                          |
    | F         | Registration resolver selection and V2 multi-name execution | One explicit selection survives commitment/reveal/reload and applies to every batch name, including retries.                                                                                         |
    | G         | Primary-name editing and migration integration              | Correct reverse flow and record-aware migration pass their supported-path tests.                                                                                                                     |
    | H         | Cross-feature validation and rollout                        | The acceptance matrix passes against the supported deployment; indexer backfill and cache invalidation are ready.                                                                                    |

    Enable features per supported chain and verified resolver implementation. Release read-only discovery before write controls if backend backfill is still catching up, but do not call the full feature complete while agreed write flows remain unavailable. Preserve legacy/custom resolution support throughout. Confirm the configured Universal Resolver and existing library integration using the [ENS readiness checks](https://docs.ens.domains/web/ensv2-readiness/).

    Coordinate the following engineering details during milestone A without reopening settled product choices: actual backend repository/schema conventions, complete historical log access, ABI-value retrieval, verified subname registry discovery, deployed reverse contracts, and supported bulk transaction execution. Route names and DTO names in this plan can be adjusted to project conventions while preserving the agreed behavior.

    Use existing protocol contracts and keep user actions explicit. The implementation is complete when the new UI, onchain operations, indexed state, personalized API responses, and existing name views behave consistently under both full and delegated access.

## Frontend implementation handoff — 13 October 2026

Scope was narrowed to this frontend checkout. Database, API and indexer implementation remain with the backend developer. No backend service or database migrations were added here. Personal aliases and the preferred resolver use authenticated API requests only. Local browser persistence holds transaction recovery and registration commitment inputs, not personal preferences.

The concrete client lives in `src/api/ens-v2/index.ts`; JSON response interfaces live in `src/types/ens-v2.ts`. Successful responses use `{ "success": true, "data": ... }`. Missing services show an unavailable state; the frontend does not synthesize configurations from cached name metadata.

| Method    | Path                                                                       | Response / request                                                                                                                       |
| --------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| GET       | `/users/me/ens/resolvers?chainId=&query=&cursor=`                          | `Page<ResolverSummary>`; merge wallet aliases and include deployed/currently delegated resolvers                                         |
| GET       | `/ens/resolvers/:chainId/:resolver`                                        | `ResolverSummary`, including current wallet grants, implementation support and index watermark                                           |
| GET       | `/ens/resolvers/:chainId/:resolver/configurations?cursor=`                 | `Page<ConfigurationSummary>` including unused positive IDs                                                                               |
| GET       | `/ens/resolvers/:chainId/:resolver/configurations/:recordId`               | `Configuration`, including raw typed records, a DNS-encoded linked editing anchor, completeness and watermark                            |
| GET       | `/ens/resolvers/:chainId/:resolver/configurations/:recordId/names?cursor=` | `Page<ConfigurationName>` with explicit/default and inherited flags                                                                      |
| GET       | `/ens/resolvers/:chainId/:resolver/names?cursor=`                          | `Page<ConfigurationName & { recordId: string                                                                                             | null }>` for the resolver's Names tab |
| GET       | `/ens/resolvers/:chainId/:resolver/roles`                                  | `RoleGrant[]`, including argument labels when known                                                                                      |
| GET       | `/ens/names/:name/context?chainId=`                                        | `NameContext`: version, holding registry, canonical ID, resolver kind, explicit and effective record IDs                                 |
| GET       | `/ens/names/:name/records?chainId=`                                        | `NameRecordSnapshot`: discovered typed keys, source resolver, enumeration coverage and warnings; migration re-reads these values onchain |
| GET / PUT | `/users/me/ens/preferences`                                                | GET query `chainId`; PUT `{ chainId, preferredResolver }`                                                                                |
| PUT       | `/users/me/ens/aliases`                                                    | `{ chainId, resolver, recordId?, label }`; null label clears this wallet's alias                                                         |
| POST      | `/users/me/ens/operations`                                                 | `{ chainId, transactionHash, anchor? }`; request index refresh and record internal editing anchors                                       |

All record IDs, resources, role bitmaps, coin types, ABI content types and block numbers are decimal strings. Address, ABI, data and contenthash values are hexadecimal bytes. A configuration's `anchor` is DNS wire-format bytes, not a plaintext ENS name. A default bundle has a positive ID linked from the root node; ID `0` is reserved for unlinking/fallback. `defaultRecordId`/`effectiveRecordId` are null when no effective records exist. `grants` must reflect current authority, independently of deployer identity; argument-scoped role rows need the decoded `argument` where known. Return `supported: false` for unknown implementations. The frontend verifies the factory implementation and simulates writes again immediately before signing.

Counts exclude internal anchors, inactive links after a resolver change and duplicate names; use one name row with an explicit/default badge. Resolver counts are known indexed usage, not exhaustive wildcard resolution. An indexed block watermark must only advance past a transaction after its changes are visible in the returned records. Never mark an incomplete legacy key inventory complete merely because standard ENS keys have been fetched.

Implemented surfaces include the settings routes, wallet aliases/default preference clients, resolver deployment and per-role access management, configuration creation/duplication/default selection, typed record editing, name assignment, V1/V2 modal routing, registration resolver selection and immutable versioned snapshots, per-name V2 batch execution, Ethereum primary-name updates, and a separate migration/configuration assistant. Bulk edits deduplicate shared configurations and reject conflicting per-name changes. Predicted registration resolver deployment is available alongside deployment of additional resolver instances.

Validation and remaining integration gates:

- Run `bun run test:ens-v2`, `bun run typecheck`, and ESLint/Prettier for the changed files. Core tests exercise codecs, permissions, allocation/link events, stale records, and persisted registration inputs.
- API-dependent views require the above backend endpoints. Test authenticated wallet switching, role changes, pagination, index lag/reorg behavior and actual wallet rejection/recovery against the deployed services.
- The migration assistant handles eligible second-level `.eth` names and resolver setup for already-migrated names. It explicitly blocks subname token migrations and names with a permanently frozen resolver; those require the parent WrapperRegistry path or PublicResolverV2 preservation/substitution support before this frontend should enable them. It never promises to copy undiscovered records.
- Reverse-name editing currently targets the Ethereum `addr.reverse` registrar discovered from the configured V1 registry. Cross-chain/default reverse preferences and V2-native reverse adapters are not implied by this control.
- Setter-only writes recheck their editing anchor and changed values before simulation. The deployed resolver has no compare-and-swap primitive; another authorized administrator can still change a shared anchor or field between simulation and transaction inclusion. Prefer stable indexed internal anchors.
- No wallet transactions were submitted during implementation. A live testnet integration pass is required before release. Browser review without an authenticated wallet covers the settings shell and sign-in boundary only.
