import pytest
from datetime import date, time
from pydantic import ValidationError
from app.schemas import TimeEntryCreate


def test_valid_time_entry():
    """Test that valid time entries pass validation"""
    valid_entry = TimeEntryCreate(
        date=date(2024, 1, 1), start_time=time(9, 0), end_time=time(17, 30)
    )
    assert valid_entry.start_time == time(9, 0)
    assert valid_entry.end_time == time(17, 30)


def test_five_minute_increment_validation():
    """Test that times must be on 5-minute increments"""
    # Valid 5-minute increments
    valid_times = [
        time(9, 0),
        time(9, 5),
        time(9, 10),
        time(9, 15),
        time(9, 30),
        time(9, 55),
    ]

    for valid_time in valid_times:
        entry = TimeEntryCreate(
            date=date(2024, 1, 1), start_time=valid_time, end_time=time(17, 0)
        )
        assert entry.start_time == valid_time

    # Invalid times (not on 5-minute increments)
    invalid_times = [
        time(9, 1),
        time(9, 3),
        time(9, 7),
        time(9, 12),
        time(9, 23),
        time(9, 59),
    ]

    for invalid_time in invalid_times:
        with pytest.raises(ValidationError) as exc_info:
            TimeEntryCreate(
                date=date(2024, 1, 1), start_time=invalid_time, end_time=time(17, 0)
            )
        assert "5-minute increments" in str(exc_info.value)


def test_start_time_before_end_time():
    """Test that start time must be before end time"""
    # Valid: start before end
    valid_entry = TimeEntryCreate(
        date=date(2024, 1, 1), start_time=time(9, 0), end_time=time(17, 0)
    )
    assert valid_entry.start_time < valid_entry.end_time

    # Invalid: start after end (same day)
    with pytest.raises(ValidationError) as exc_info:
        TimeEntryCreate(
            date=date(2024, 1, 1), start_time=time(17, 0), end_time=time(9, 0)
        )
    assert "Start time must be before end time" in str(exc_info.value)

    # Invalid: start equals end
    with pytest.raises(ValidationError) as exc_info:
        TimeEntryCreate(
            date=date(2024, 1, 1), start_time=time(9, 0), end_time=time(9, 0)
        )
    assert "Start time must be before end time" in str(exc_info.value)


def test_overnight_entries():
    """Test overnight entries (crossing midnight)"""
    # Valid overnight entry (end before 6 AM)
    valid_overnight = TimeEntryCreate(
        date=date(2024, 1, 1), start_time=time(23, 0), end_time=time(5, 30)
    )
    assert valid_overnight.start_time == time(23, 0)
    assert valid_overnight.end_time == time(5, 30)

    # Invalid overnight entry (end after 6 AM)
    with pytest.raises(ValidationError) as exc_info:
        TimeEntryCreate(
            date=date(2024, 1, 1), start_time=time(23, 0), end_time=time(7, 0)
        )
    assert "overnight entries" in str(exc_info.value).lower()


def test_seconds_are_removed():
    """Test that seconds and microseconds are automatically removed"""
    entry = TimeEntryCreate(
        date=date(2024, 1, 1),
        start_time=time(9, 15, 30, 500000),  # With seconds and microseconds
        end_time=time(17, 25, 45, 123456),  # With seconds and microseconds
    )

    # Seconds and microseconds should be stripped
    assert entry.start_time == time(9, 15)
    assert entry.end_time == time(17, 25)


def test_combined_validation_errors():
    """Test multiple validation errors at once"""
    with pytest.raises(ValidationError) as exc_info:
        TimeEntryCreate(
            date=date(2024, 1, 1),
            start_time=time(9, 7),  # Invalid: not 5-minute increment
            end_time=time(9, 3),  # Invalid: not 5-minute increment AND before start
        )

    error_msg = str(exc_info.value)
    assert "5-minute increments" in error_msg
    # Note: The start/end time validation might not trigger if individual field validation fails first
