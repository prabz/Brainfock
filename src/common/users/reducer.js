import * as authActions from '../auth/actions';
import * as actions from '../users/actions';
import User from './user';
import CurrentUser from './currentUser';
import ChangePasswordForm from './changePassword.form.js';
import {List, Range, Record, Map} from 'immutable';
import getRandomString from '../lib/getRandomString';

const InitialState = Record({
  viewer: null,
  listFilters: List(),
  newUser: new User,
  viewUser: new User,
  list: List(),
  listMeta: new (Record({
    isFetching: true,
    count: 0,
  })),
  forms: new Map()
});
const initialState = new InitialState;

function revive({viewer}) {
  return initialState.merge({
    // Handle user authenticated on the server.
    viewer: viewer ? new CurrentUser(viewer) : null
  });
}

export default function usersReducer(state = initialState, action) {
  if (!(state instanceof InitialState)) return revive(state);

  switch (action.type) {

    case authActions.LOGIN_SUCCESS: {
      let setUser = {...action.payload.user, authToken:action.payload.id};
      return state.set('viewer', new CurrentUser(setUser));
    }
    // TODO: remove 'LOGOUT' action from list when logout fetch is fixed
    case authActions.LOGOUT:
    case authActions.LOGOUT_SUCCESS: {
      return state.set('viewer',null);
    }

    case actions.FIND:
      return state
        .setIn(['listMeta', 'isFetching'], true)
        .update('list', list => list.clear());

    case actions.FIND_ERROR:
      return state.setIn(['listMeta', 'isFetching'], false)

    case actions.FIND_SUCCESS: {
      const newlist = action.payload.map((item) => {
        item.cid = getRandomString();
        return new User(item);
      });
      return state
        .update('list', list => list.clear())
        .update('list', list => list.push(...newlist))
        .setIn(['listMeta', 'isFetching'], false)
        ;
    }

    case actions.SETUP_USER_UPDATE_FORM: {
      if (!state.getIn(['forms', 'id', action.payload.userId, action.payload.formKey])) {
        return state
          .setIn(['forms', 'id', action.payload.userId, action.payload.formKey], new (ChangePasswordForm))
      } else {
        return state;
      }
    }
    case actions.SET_USER_UPDATE_FORM_FIELD: {
      const {name, value, userId, formKey} = action.payload;
      return state
        .setIn(['forms', 'id', userId, formKey, 'data', name], value)
        .deleteIn(['forms', 'id', userId, formKey, 'meta', 'errors', name])
        .deleteIn(['forms', 'id', userId, formKey, 'meta', 'postedOn'])
    }
  }

  return state;
}
