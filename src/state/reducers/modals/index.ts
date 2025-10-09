import { combineReducers } from 'redux'

import searchModal from './searchModal'
import editOfferModal from './editOfferModal'
import quickOfferModal from './quickOfferModal'
import cancelOfferModal from './cancelOfferModal'
import acceptOfferModal from './acceptOfferModal'
import transferTokenModal from './transferTokenModal'
import editUserListingModal from './editUserListingModal'
import cancelUserListingModal from './cancelUserListingModal'

const modalReducer = combineReducers({
  searchReducer: searchModal,
  cancelOfferReducer: cancelOfferModal,
  cancelUserListingReducer: cancelUserListingModal,
  editUserListingReducer: editUserListingModal,
  acceptOfferReducer: acceptOfferModal,
  editOfferReducer: editOfferModal,
  quickOfferReducer: quickOfferModal,
  transferTokenReducer: transferTokenModal,
})

export default modalReducer
