'use client'

import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useRoleDraftEditor, useRoleSection, useV2RoleTransaction } from '@/hooks/records/useV2Roles'
import { RoleSection } from '@/components/modal/records/v2/rolesPanel'
import { AddRoleAccount } from '@/components/modal/records/v2/rolesEditor'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { SettingsNotice } from './shared'
import { useSettingsDirty } from './navigationGuard'

export default function ResolverPermissions({ resolver }: { resolver: Address }) {
  const { address } = useAccount()
  const section = useRoleSection('resolver', resolver)
  const editor = useRoleDraftEditor(address)
  const transaction = useV2RoleTransaction(null, editor.onConfirmed)
  const key = `${address}:${resolver}`
  const disabled = transaction.busy || !!transaction.pending

  useSettingsDirty(editor.hasChanges, disabled)

  return (
    <div className='flex max-w-3xl flex-col gap-5'>
      <RoleSection
        kind='resolver'
        resolverSection={section}
        editor={editor}
        extraAssignments={editor.accounts[key]}
        disabled={disabled}
        collapsible
        showHeader={false}
      >
        <AddRoleAccount
          kind='resolver'
          viewer={address}
          section={section}
          disabled={disabled}
          onAdd={(assignment) => editor.addAccount(key, assignment)}
          showNameImage
        />
      </RoleSection>
      {editor.changes.some((change) => change.admin && change.action === 'revoke') && (
        <SettingsNotice>
          Removing Admin permissions can permanently remove control if no other account retains the corresponding Admin
          role.
        </SettingsNotice>
      )}
      {transaction.error && (
        <SettingsNotice error>
          {transaction.error} Confirmed changes have already been saved; remaining changes stay queued.
        </SettingsNotice>
      )}
      {transaction.step === 'success' && !editor.hasChanges && <SettingsNotice>Permissions saved.</SettingsNotice>}
      {transaction.explorerUrl && (
        <a className='text-primary text-lg underline' target='_blank' rel='noreferrer' href={transaction.explorerUrl}>
          View transaction
        </a>
      )}
      <div className='border-tertiary flex gap-2 border-t pt-4'>
        <PrimaryButton
          className='w-1/2'
          disabled={transaction.busy || editor.walletChanged || (!editor.hasChanges && !transaction.pending)}
          onClick={() => transaction.submit(editor.changes)}
        >
          {transaction.busy ? 'Saving permissions…' : transaction.pending ? 'Check transaction' : 'Save changes'}
        </PrimaryButton>
        <SecondaryButton className='w-1/2' disabled={!editor.hasChanges || disabled} onClick={editor.reset}>
          Reset changes
        </SecondaryButton>
      </div>
    </div>
  )
}
