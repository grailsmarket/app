import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketplaceDomainType } from '@/types/domains'

// Types --------------------------------------------
export type MarketplaceDomainIdType = number
export type MarketplaceDomainNameType = string

export type CartDomainType = MarketplaceDomainType & {
  cartItemId: number
  cartType: 'sales' | 'registrations'
}

export type CartUnregisteredDomainType = CartDomainType & {
  registrationPeriod?: number
}
export type CartRegisteredDomainType = CartDomainType & {
  offerValue?: number
}

export type ExtendDurationUnitsType = 'Year' | 'Month'

export type OfferDurationUnitsType = 'Day' | 'Week' | 'Month'
export type DurationType = {
  value: number | undefined
  units: OfferDurationUnitsType
}

export type MarketplaceCheckoutType = '' | 'Registration' | 'Purchase' | 'Offer'

type MarketplaceDomainsState = {
  cartUnregisteredDomains: CartUnregisteredDomainType[]
  cartRegisteredDomains: CartRegisteredDomainType[]
  changedPurchaseDomains: string[]
  isCheckingOut: boolean
  viewType: 'list' | 'grid'
  isModifyingCart: boolean
  modifyingCartTokenIds: string[]
}

// Initial State ------------------------------------
const initialState: MarketplaceDomainsState = {
  cartUnregisteredDomains: [],
  cartRegisteredDomains: [],
  changedPurchaseDomains: [],
  isCheckingOut: false,
  viewType: 'grid',
  isModifyingCart: false,
  modifyingCartTokenIds: [],
}

// Slice -------------------------------------------
export const marketplaceDomainsSlice = createSlice({
  name: 'marketplaceDomains',
  initialState,
  reducers: {
    setCartRegisteredDomains(state, { payload }: PayloadAction<CartRegisteredDomainType[]>) {
      state.cartRegisteredDomains = payload
    },
    setCartUnregisteredDomains(state, { payload }: PayloadAction<CartUnregisteredDomainType[]>) {
      state.cartUnregisteredDomains = payload
    },
    // Adds multiple (not only one)
    addToCartRegisteredDomains(state, { payload }: PayloadAction<CartRegisteredDomainType[]>) {
      state.cartRegisteredDomains = state.cartRegisteredDomains.concat(payload)
    },
    // Adds multiple (not only one)
    addToCartUnregisteredDomains(state, { payload }: PayloadAction<CartUnregisteredDomainType[]>) {
      state.cartUnregisteredDomains = state.cartUnregisteredDomains.concat(payload)
    },
    removeFromMarketplaceDomainsCart(state, { payload }: PayloadAction<MarketplaceDomainNameType[]>) {
      state.cartUnregisteredDomains = state.cartUnregisteredDomains.filter((domain) => !payload.includes(domain.name))
      state.cartRegisteredDomains = state.cartRegisteredDomains.filter((domain) => !payload.includes(domain.name))
    },
    updateRegistrationPeriod(
      state,
      { payload }: PayloadAction<{ name: MarketplaceDomainNameType; newPeriod: number }>
    ) {
      const relevantDomain = state.cartUnregisteredDomains.find((domain) => domain.name === payload.name)

      if (relevantDomain) {
        relevantDomain.registrationPeriod = payload.newPeriod
      }
    },
    addPurchaseDomainChanged(state, { payload }: PayloadAction<string>) {
      state.changedPurchaseDomains = state.changedPurchaseDomains.concat([payload])
    },
    removePurchaseDomainsChanged(state, { payload }: PayloadAction<string[]>) {
      state.changedPurchaseDomains = state.changedPurchaseDomains.filter((name) => !payload.includes(name))
    },
    setDomainsIsCheckingOut(state, { payload }: PayloadAction<boolean>) {
      state.isCheckingOut = payload
    },
    setViewType(state, { payload }: PayloadAction<'list' | 'grid'>) {
      state.viewType = payload
    },
    clearMarketplaceDomainsCart(state) {
      state.cartUnregisteredDomains = []
      state.cartRegisteredDomains = []
    },
    setModifyingCartTokenIds(state, { payload }: PayloadAction<string[]>) {
      state.modifyingCartTokenIds = payload
    },
    addModifyingCartTokenId(state, { payload }: PayloadAction<string>) {
      state.modifyingCartTokenIds = state.modifyingCartTokenIds.concat([payload])
    },
    removeModifyingCartTokenId(state, { payload }: PayloadAction<string>) {
      state.modifyingCartTokenIds = state.modifyingCartTokenIds.filter((tokenId) => tokenId !== payload)
    },
    toggleModifyingCart(state, { payload }: PayloadAction<{ isModifying: boolean; tokenId: string }>) {
      state.modifyingCartTokenIds = payload.isModifying
        ? state.modifyingCartTokenIds.concat([payload.tokenId])
        : state.modifyingCartTokenIds.filter((tokenId) => tokenId !== payload.tokenId)
    },
  },
})

// Actions --------------------------------------------
export const {
  setCartRegisteredDomains,
  addToCartRegisteredDomains,
  removeFromMarketplaceDomainsCart,
  setCartUnregisteredDomains,
  addToCartUnregisteredDomains,
  updateRegistrationPeriod,
  addPurchaseDomainChanged,
  removePurchaseDomainsChanged,
  clearMarketplaceDomainsCart,
  setDomainsIsCheckingOut,
  setViewType,
  setModifyingCartTokenIds,
  addModifyingCartTokenId,
  removeModifyingCartTokenId,
  toggleModifyingCart,
} = marketplaceDomainsSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceDomains = (state: RootState) => state.domains.marketplaceDomains

// Reducer --------------------------------------------
export default marketplaceDomainsSlice.reducer
