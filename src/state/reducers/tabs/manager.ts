import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { DurationType, ExtendDurationUnitsType } from '../domains/marketplaceDomains'

// Types --------------------------------------------
export type DomainsToListType = {
  name: string
  tokenId: string
  collectionId: string
  price?: number
  initialPrice?: number
}

export type DomainsToExtendType = {
  name: string
  tokenId: string
  duration: number
}

export type ExtendDurationType = {
  value: number | undefined
  units: ExtendDurationUnitsType
}

type ManagerPanelState = {
  open: boolean
  // firstTimeOpen: boolean
  domainsToExtend: DomainsToExtendType[]
  extendDuration: ExtendDurationType
  domainsToList: DomainsToListType[]
  listingDuration: DurationType
}

// Initial State ------------------------------------
const initialState: ManagerPanelState = {
  open: false,
  // firstTimeOpen: false,
  domainsToExtend: [],
  extendDuration: {
    value: undefined,
    units: 'Year',
  },
  domainsToList: [],
  listingDuration: {
    value: undefined,
    units: 'Day',
  },
}

// Slice -------------------------------------------
export const ManagerPanelSlice = createSlice({
  name: 'ManagerPanel',
  initialState,
  reducers: {
    setManagerPanelOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    // setManagerPanelFirstTimeOpen(state, { payload }: PayloadAction<boolean>) {
    //   state.firstTimeOpen = payload
    // },
    setDomainsToExtend(state, { payload }: PayloadAction<DomainsToExtendType[]>) {
      state.domainsToExtend = payload
    },
    addDomainsToExtend(state, { payload }: PayloadAction<DomainsToExtendType[]>) {
      state.domainsToExtend = state.domainsToExtend.concat(payload)
    },
    removeDomainToExtend(state, { payload }: PayloadAction<string>) {
      state.domainsToExtend = state.domainsToExtend.filter((d) => d.name !== payload)
    },
    setExtendDuration(state, { payload }: PayloadAction<ExtendDurationType>) {
      state.extendDuration = payload
    },
    setDomainsToList(state, { payload }: PayloadAction<DomainsToListType[]>) {
      state.domainsToList = payload
    },
    addDomainsToList(state, { payload }: PayloadAction<DomainsToListType[]>) {
      state.domainsToList = state.domainsToList.concat(payload)
    },
    removeDomainToList(state, { payload }: PayloadAction<DomainsToListType>) {
      state.domainsToList = state.domainsToList.filter((d) => d.name !== payload.name)
    },
    updateListingPrice(
      state,
      {
        payload,
      }: PayloadAction<{
        name: string
        newOfferValue: number | undefined
      }>
    ) {
      const relevantDomain = state.domainsToList.find(({ name }) => name === payload.name)

      if (relevantDomain) {
        relevantDomain.price = payload.newOfferValue
      }
    },
    setListingDuration(state, { payload }: PayloadAction<DurationType>) {
      state.listingDuration = payload
    },
  },
})

// Actions --------------------------------------------
export const {
  setManagerPanelOpen,
  setDomainsToExtend,
  addDomainsToExtend,
  removeDomainToExtend,
  setExtendDuration,
  setDomainsToList,
  addDomainsToList,
  removeDomainToList,
  updateListingPrice,
  setListingDuration,
} = ManagerPanelSlice.actions

// Selectors ------------------------------------------
export const selectManagerPanel = (state: RootState) => state.tabs.managerPanel

// Reducer --------------------------------------------
export default ManagerPanelSlice.reducer
