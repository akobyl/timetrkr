from datetime import datetime, time, timedelta


def effective_minutes(entries, start_date, end_date):
    """Union entry intervals, clipped to the inclusive calendar date range."""
    lower = datetime.combine(start_date, time.min)
    upper = datetime.combine(end_date + timedelta(days=1), time.min)
    intervals = []
    for entry in entries:
        start = datetime.combine(entry.date, entry.start_time)
        end = datetime.combine(entry.date, entry.end_time)
        if end < start:
            end += timedelta(days=1)
        start, end = max(start, lower), min(end, upper)
        if start < end:
            intervals.append((start, end))

    seconds = 0
    previous_end = lower
    for start, end in sorted(intervals):
        seconds += max(0, (end - max(start, previous_end)).total_seconds())
        previous_end = max(previous_end, end)
    return int(seconds // 60)
