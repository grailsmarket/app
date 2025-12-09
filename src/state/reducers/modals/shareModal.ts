import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DomainListingType, DomainOfferType } from '@/types/domains'

type ShareModalState = {
  open: boolean
  type: 'listing' | 'offer' | null
  listing: DomainListingType | null
  offer: DomainOfferType | null
  domainName: string | null
  ownerAddress: string | null
}

const initialState: ShareModalState = {
  open: false,
  type: null,
  listing: null,
  offer: null,
  domainName: null,
  ownerAddress: null,
}

export const ShareModalSlice = createSlice({
  name: 'ShareModal',
  initialState,
  reducers: {
    setShareModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
      if (!payload) {
        // Reset state when closing
        state.type = null
        state.listing = null
        state.offer = null
        state.domainName = null
        state.ownerAddress = null
      }
    },
    setShareModalType(state, { payload }: PayloadAction<'listing' | 'offer' | null>) {
      state.type = payload
    },
    setShareModalListing(state, { payload }: PayloadAction<DomainListingType | null>) {
      state.listing = payload
    },
    setShareModalOffer(state, { payload }: PayloadAction<DomainOfferType | null>) {
      state.offer = payload
    },
    setShareModalDomainInfo(
      state,
      {
        payload,
      }: PayloadAction<{ name: string; ownerAddress: string | null }>
    ) {
      state.domainName = payload.name
      state.ownerAddress = payload.ownerAddress
    },
  },
})

export const {
  setShareModalOpen,
  setShareModalType,
  setShareModalListing,
  setShareModalOffer,
  setShareModalDomainInfo,
} = ShareModalSlice.actions

export const selectShareModal = (state: RootState) => state.modals.shareReducer

export default ShareModalSlice.reducer
