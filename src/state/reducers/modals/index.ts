import { combineReducers } from 'redux'

import searchModal from './searchModal'
import makeOfferModal from './makeOfferModal'
import cancelOfferModal from './cancelOfferModal'
import acceptOfferModal from './acceptOfferModal'
import makeListingModal from './makeListingModal'
import transferTokenModal from './transferTokenModal'
import cancelUserListingModal from './buyNowModal'
import buyNowModal from './buyNowModal'

const modalReducer = combineReducers({
  searchReducer: searchModal,
  cancelOfferReducer: cancelOfferModal,
  cancelListingReducer: cancelUserListingModal,
  acceptOfferReducer: acceptOfferModal,
  makeOfferReducer: makeOfferModal,
  makeListingReducer: makeListingModal,
  transferTokenReducer: transferTokenModal,
  buyNowReducer: buyNowModal,
})

export default modalReducer
