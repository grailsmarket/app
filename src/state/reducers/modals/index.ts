import { combineReducers } from 'redux'

import searchModal from './searchModal'
import makeOfferModal from './makeOfferModal'
import cancelOfferModal from './cancelOfferModal'
import acceptOfferModal from './acceptOfferModal'
import makeListingModal from './makeListingModal'
import transferTokenModal from './transferTokenModal'
import cancelListingModal from './cancelListingModal'
import buyNowModal from './buyNowModal'
import notificationModal from './notificationModal'
import bulkRenewalModal from './bulkRenewalModal'
import transferModal from './transferModal'
import bulkSelectModal from './bulkSelectModal'
import shareModal from './shareModal'
import editRecordsModal from './editRecordsModal'

const modalReducer = combineReducers({
  searchReducer: searchModal,
  cancelOfferReducer: cancelOfferModal,
  cancelListingReducer: cancelListingModal,
  acceptOfferReducer: acceptOfferModal,
  makeOfferReducer: makeOfferModal,
  makeListingReducer: makeListingModal,
  transferTokenReducer: transferTokenModal,
  buyNowReducer: buyNowModal,
  notificationReducer: notificationModal,
  bulkRenewalReducer: bulkRenewalModal,
  transferReducer: transferModal,
  bulkSelectReducer: bulkSelectModal,
  shareReducer: shareModal,
  editRecordsReducer: editRecordsModal,
})

export default modalReducer
