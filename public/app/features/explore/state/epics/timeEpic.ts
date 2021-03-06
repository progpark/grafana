import { Epic } from 'redux-observable';
import { map } from 'rxjs/operators';
import { AbsoluteTimeRange, RawTimeRange } from '@grafana/data';

import { ActionOf } from 'app/core/redux/actionCreatorFactory';
import { StoreState } from 'app/types/store';
import { updateTimeRangeAction, UpdateTimeRangePayload, changeRangeAction } from '../actionTypes';
import { EpicDependencies } from 'app/store/configureStore';

export const timeEpic: Epic<ActionOf<any>, ActionOf<any>, StoreState, EpicDependencies> = (
  action$,
  state$,
  { getTimeSrv, getTimeRange, getTimeZone, dateTimeForTimeZone }
) => {
  return action$.ofType(updateTimeRangeAction.type).pipe(
    map((action: ActionOf<UpdateTimeRangePayload>) => {
      const { exploreId, absoluteRange: absRange, rawRange: actionRange } = action.payload;
      const itemState = state$.value.explore[exploreId];
      const timeZone = getTimeZone(state$.value.user);
      const { range: rangeInState } = itemState;
      let rawRange: RawTimeRange = rangeInState.raw;

      if (absRange) {
        rawRange = {
          from: dateTimeForTimeZone(timeZone, absRange.from),
          to: dateTimeForTimeZone(timeZone, absRange.to),
        };
      }

      if (actionRange) {
        rawRange = actionRange;
      }

      const range = getTimeRange(timeZone, rawRange);
      const absoluteRange: AbsoluteTimeRange = { from: range.from.valueOf(), to: range.to.valueOf() };

      getTimeSrv().init({
        time: range.raw,
        refresh: false,
        getTimezone: () => timeZone,
        timeRangeUpdated: (): any => undefined,
      });

      return changeRangeAction({ exploreId, range, absoluteRange });
    })
  );
};
