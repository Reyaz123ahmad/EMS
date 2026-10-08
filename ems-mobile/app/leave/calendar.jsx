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
import leaveService from '../../services/leave.service';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react-native';

export default function LeaveCalendarScreen() {
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
    queryKey: ['leaveCalendar', monthNumber, yearNumber],
    queryFn: () => leaveService.getCalendar({ month: monthNumber, year: yearNumber }),
  });

  const monthLabel = currentDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
  const firstDayOfWeek = new Date(yearNumber, monthNumber - 1, 1).getDay();

  // Parse leaves list from API
  const leavesList = calendarData?.leaves || calendarData?.data?.leaves || (Array.isArray(calendarData) ? calendarData : []);

  // Map days with approved leaves
  const leaveDaySet = new Set();
  leavesList.forEach((req) => {
    if (req.startDate && req.endDate) {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        if (cur.getMonth() + 1 === monthNumber && cur.getFullYear() === yearNumber) {
          leaveDaySet.add(cur.getDate());
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else if (req.startDate) {
      const start = new Date(req.startDate);
      if (start.getMonth() + 1 === monthNumber && start.getFullYear() === yearNumber) {
        leaveDaySet.add(start.getDate());
      }
    }
  });

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
            <Text style={styles.monthSub}>Leave & Time-Off Calendar</Text>
          </View>
          <TouchableOpacity style={styles.arrowBtn} onPress={goNext} activeOpacity={0.7}>
            <ChevronRight size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Approved Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
            <Text style={styles.legendText}>Working Day</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading leave schedule...</Text>
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
                  const hasLeave = leaveDaySet.has(day);
                  const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <View
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        hasLeave && styles.dayCellLeave,
                        !hasLeave && isWeekend && styles.dayCellWeekend,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          hasLeave && styles.dayTextLeave,
                          !hasLeave && isWeekend && styles.dayTextWeekend,
                        ]}
                      >
                        {day}
                      </Text>
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
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
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
    backgroundColor: '#FFFFFF',
  },
  dayCellLeave: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  dayCellWeekend: {
    backgroundColor: '#F8FAFC',
  },
  dayText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  dayTextLeave: { color: '#2563EB', fontWeight: '800' },
  dayTextWeekend: { color: '#94A3B8' },
});
