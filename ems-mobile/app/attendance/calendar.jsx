import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import attendanceService from '../../services/attendance.service';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react-native';

export default function AttendanceCalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNumber = currentDate.getMonth() + 1;
  const yearNumber = currentDate.getFullYear();

  const goPrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['attendanceCalendar', monthNumber, yearNumber],
    queryFn: () => attendanceService.getCalendar({ month: monthNumber, year: yearNumber }),
  });

  const monthLabel = currentDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
  const firstDayOfWeek = new Date(yearNumber, monthNumber - 1, 1).getDay();

  // Create day mapping from backend response
  const rawDays = calendarData?.days || calendarData?.data?.days || (Array.isArray(calendarData) ? calendarData : []);
  const dayMap = {};
  rawDays.forEach((item) => {
    const dayNum = item.day || (item.date ? new Date(item.date).getDate() : null);
    if (dayNum) {
      dayMap[dayNum] = item;
    }
  });

  // Calculate day cells
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Month Selector */}
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goPrev} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Text style={styles.monthSub}>Day-by-Day Roster</Text>
          </View>
          <TouchableOpacity style={styles.arrowBtn} onPress={goNext} activeOpacity={0.7}>
            <ChevronRight size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Late</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.legendText}>Off</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading month data...</Text>
            </View>
          ) : (
            <>
              <View style={styles.weekDaysRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                  <Text key={idx} style={styles.weekDayText}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {blanks.map((b) => (
                  <View key={`blank-${b}`} style={styles.blankCell} />
                ))}

                {monthDays.map((day) => {
                  const dayObj = dayMap[day];
                  const logStatus = dayObj?.logs?.[0]?.status || dayObj?.status;
                  const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  let cellStyle = styles.dayCellDefault;
                  let textStyle = styles.dayTextDefault;

                  if (logStatus === 'PRESENT' || (dayObj?.summary?.present ?? 0) > 0) {
                    cellStyle = styles.dayCellPresent;
                    textStyle = styles.dayTextPresent;
                  } else if (logStatus === 'LATE' || (dayObj?.summary?.late ?? 0) > 0) {
                    cellStyle = styles.dayCellLate;
                    textStyle = styles.dayTextLate;
                  } else if (logStatus === 'ABSENT' || (dayObj?.summary?.absent ?? 0) > 0) {
                    cellStyle = styles.dayCellAbsent;
                    textStyle = styles.dayTextAbsent;
                  } else if (logStatus === 'HALF_DAY' || (dayObj?.summary?.halfDay ?? 0) > 0) {
                    cellStyle = styles.dayCellHalfDay;
                    textStyle = styles.dayTextHalfDay;
                  } else if (
                    logStatus === 'ON_LEAVE' ||
                    logStatus === 'LEAVE' ||
                    (dayObj?.summary?.onLeave ?? 0) > 0
                  ) {
                    cellStyle = styles.dayCellLeave;
                    textStyle = styles.dayTextLeave;
                  } else if (isWeekend) {
                    cellStyle = styles.dayCellWeekend;
                    textStyle = styles.dayTextWeekend;
                  }

                  return (
                    <View key={`day-${day}`} style={[styles.dayCell, cellStyle]}>
                      <Text style={[styles.dayText, textStyle]}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 22, paddingBottom: 44 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  monthTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  monthSub: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11.5, color: '#64748B', fontWeight: '700' },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankCell: {
    width: '14.28%',
    height: 46,
  },
  dayCell: {
    width: '14.28%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 12,
  },
  dayCellDefault: { backgroundColor: '#FFFFFF' },
  dayCellPresent: { backgroundColor: '#ECFDF5' },
  dayCellLate: { backgroundColor: '#FEF3C7' },
  dayCellAbsent: { backgroundColor: '#FEF2F2' },
  dayCellHalfDay: { backgroundColor: '#FFF7ED' },
  dayCellLeave: { backgroundColor: '#EFF6FF' },
  dayCellWeekend: { backgroundColor: '#F8FAFC' },

  dayText: { fontSize: 13, fontWeight: '700' },
  dayTextDefault: { color: '#334155' },
  dayTextPresent: { color: '#059669', fontWeight: '800' },
  dayTextLate: { color: '#D97706', fontWeight: '800' },
  dayTextAbsent: { color: '#DC2626', fontWeight: '800' },
  dayTextHalfDay: { color: '#EA580C', fontWeight: '800' },
  dayTextLeave: { color: '#2563EB', fontWeight: '800' },
  dayTextWeekend: { color: '#94A3B8' },
});
