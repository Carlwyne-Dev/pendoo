import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, StyleSheet, Alert, LayoutAnimation } from 'react-native';
import Reanimated, { useAnimatedStyle, withTiming, Easing, FadeIn, FadeOut, SlideOutUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, parseISO, format, startOfDay } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Settings, RotateCcw, Trash2, Download, Upload, ChevronRight, X, Clock, CheckCircle, Plus, History, Home, Calendar, Pencil, ChevronLeft } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import Onboarding from './onboarding';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

interface Item {
  id: string;
  title: string;
  category: string;
  notes: string;
  followUpDate?: string | null; // legacy support
  targetDate?: string | null;
  dateType?: 'followUp' | 'expected';
  createdAt: string;
  completedAt: string | null;
}

const AVATAR_SOURCES: Record<string, any> = {
  avatar1: require('../../assets/images/pics/avatar1.png'),
  avatar2: require('../../assets/images/pics/avatar2.png'),
  avatar3: require('../../assets/images/pics/avatar3.png'),
  avatar4: require('../../assets/images/pics/avatar4.png'),
  avatar5: require('../../assets/images/pics/avatar5.png'),
  avatar6: require('../../assets/images/pics/avatar6.png'),
  avatar7: require('../../assets/images/pics/avatar7.png'),
  avatar8: require('../../assets/images/pics/avatar8.png'),
  avatar9: require('../../assets/images/pics/avatar9.png'),
};

const CATEGORIES = ['Work', 'Personal', 'Financial', 'Medical', 'Home', 'Learning', 'General'];
const { width } = Dimensions.get('window');

function DashboardHillCurve() {
  const curveHeight = 70;
  return (
    <View style={{
      position: 'absolute',
      top: -curveHeight,
      left: -width / 2,
      width: width * 2,
      height: width * 2,
      borderRadius: width,
      backgroundColor: '#e3eadc',
    }} />
  );
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function InlineCalendar({ value, onChange }: { value: Date | null; onChange: (date: Date) => void }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(value ? new Date(value) : new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) =>
    value && value.getFullYear() === year && value.getMonth() === month && value.getDate() === d;
  const isPast = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View style={cal.container}>
      <View style={cal.nav}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <ChevronLeft size={18} color="#4b5563" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <ChevronRight size={18} color="#4b5563" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={cal.grid}>
        {DAYS.map(d => (
          <Text key={d} style={cal.dayHeader}>{d}</Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`empty-${i}`} style={cal.cell} />;
          const selected = isSelected(d);
          const past = isPast(d);
          return (
            <TouchableOpacity
              key={`d-${d}`}
              style={[cal.cell, selected && cal.selectedCell, past && cal.pastCell]}
              onPress={() => !past && onChange(new Date(year, month, d))}
              disabled={past}
              activeOpacity={0.7}
            >
              <Text style={[cal.dayText, selected && cal.selectedDayText, past && cal.pastDayText]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor: '#f9fafb', borderRadius: 20, padding: 16, marginTop: 4 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9ca3af', paddingVertical: 4 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  selectedCell: { backgroundColor: '#456259' },
  pastCell: { opacity: 0.3 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  pastDayText: { color: '#9ca3af' },
});

function AnimatedTab({ icon: Icon, label, isActive, onPress }: any) {
  const wrapperStyle = useAnimatedStyle(() => {
    return {
      paddingHorizontal: withTiming(isActive ? 16 : 12, { duration: 350, easing: Easing.out(Easing.cubic) }),
    };
  }, [isActive]);

  const textContainerStyle = useAnimatedStyle(() => {
    return {
      maxWidth: withTiming(isActive ? 100 : 0, { duration: 350, easing: Easing.out(Easing.cubic) }),
      opacity: withTiming(isActive ? 1 : 0, { duration: 250 }),
      marginLeft: withTiming(isActive ? 6 : 0, { duration: 350, easing: Easing.out(Easing.cubic) }),
    };
  }, [isActive]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Reanimated.View style={[s.navBtn, isActive && s.navBtnActive, wrapperStyle]}>
        <Icon size={18} color={isActive ? '#fff' : '#6b7280'} strokeWidth={isActive ? 2.5 : 2} />
        <Reanimated.View style={[{ overflow: 'hidden', justifyContent: 'center' }, textContainerStyle]}>
          <Text style={[s.navBtnText, isActive && s.navBtnTextActive]} numberOfLines={1}>{label}</Text>
        </Reanimated.View>
      </Reanimated.View>
    </TouchableOpacity>
  );
}

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [avatar, setAvatar] = useState('avatar1');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [view, setView] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [notes, setNotes] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [dateType, setDateType] = useState<'followUp' | 'expected'>('followUp');

  useEffect(() => {
    const loadData = async () => {
      const isO = await AsyncStorage.getItem('pendoo_onboarded');
      setOnboarded(isO === '1');
      const savedAvatar = await AsyncStorage.getItem('pendoo_avatar');
      if (savedAvatar) setAvatar(savedAvatar);
      const savedItems = await AsyncStorage.getItem('pendoo_items');
      if (savedItems) setItems(JSON.parse(savedItems));
    };
    loadData();
  }, []);

  const hillAnimatedStyle = useAnimatedStyle(() => {
    const hasData = view === 'dashboard' 
      ? items.filter(i => !i.completedAt).length > 0 
      : items.filter(i => i.completedAt).length > 0;
      
    return {
      height: withTiming(hasData ? '25%' : '50%', { duration: 600, easing: Easing.out(Easing.exp) })
    };
  }, [view, items]);

  const saveItems = async (newItems: Item[]) => {
    setItems(newItems);
    await AsyncStorage.setItem('pendoo_items', JSON.stringify(newItems));
    
    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          for (const item of newItems) {
            const dateStr = item.targetDate || item.followUpDate;
            if (!item.completedAt && dateStr) {
              const trigger = new Date(dateStr);
              if (trigger > new Date()) {
                const isExpected = item.dateType === 'expected';
                await Notifications.scheduleNotificationAsync({
                  content: { 
                    title: isExpected ? 'Expected Date Reached' : 'Pendoo Follow-up', 
                    body: isExpected ? `Your pending item is due: ${item.title}` : `Time to check in on: ${item.title}` 
                  },
                  trigger: { type: 'date', date: trigger } as any,
                });
              }
            }
          }
        }
      } catch (error) {
        console.log('Notification scheduling failed:', error);
      }
    }
  };

  const activeItems = items.filter(i => !i.completedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedItems = items.filter(i => i.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const handleSwitchView = (newView: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setView(newView);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (isEditing && editingItem) {
      const updated = items.map(i => i.id === editingItem.id 
        ? { ...i, title, category, notes, targetDate: targetDate?.toISOString() || null, dateType } 
        : i);
      saveItems(updated);
      setIsEditing(false);
      setEditingItem(null);
      setSelectedItem(null);
    } else {
      const newItem: Item = {
        id: Math.random().toString(36).substr(2, 9),
        title, category, notes,
        targetDate: targetDate?.toISOString() || null,
        dateType,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      saveItems([newItem, ...items]);
    }
    setIsCreating(false);
  };

  const openCreateModal = () => {
    setTitle('');
    setNotes('');
    setTargetDate(null);
    setDateType('followUp');
    setShowNotes(false);
    setIsEditing(false);
    setEditingItem(null);
    setIsCreating(true);
  };

  const openEditModal = (item: Item) => {
    setTitle(item.title);
    setCategory(item.category);
    setNotes(item.notes);
    setTargetDate(item.targetDate ? new Date(item.targetDate) : (item.followUpDate ? new Date(item.followUpDate) : null));
    setDateType(item.dateType || 'followUp');
    setShowNotes(!!item.notes);
    setIsEditing(true);
    setEditingItem(item);
    setSelectedItem(null);
    setIsCreating(true);
  };

  const toggleItemStatus = (id: string) => {
    const updated = items.map(i => i.id === id
      ? { ...i, completedAt: i.completedAt ? null : new Date().toISOString() }
      : i);
    saveItems(updated);
    setSelectedItem(null);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    saveItems(updated);
    setSelectedItem(null);
  };

  const handleExport = async () => {
    const data = JSON.stringify({ items, exportedAt: new Date().toISOString() }, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = (document as any).createElement('a');
      a.href = url;
      a.download = `pendoo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      await AsyncStorage.setItem('pendoo_export', data);
      Alert.alert('Exported!', 'Backup saved to your device.');
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      const input = (document as any).createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed.items && Array.isArray(parsed.items)) {
            await saveItems(parsed.items);
            Alert.alert('Imported!', `${parsed.items.length} items restored.`);
          } else {
            Alert.alert('Invalid file', 'This does not look like a Pendoo backup.');
          }
        } catch { Alert.alert('Error', 'Could not read the file.'); }
      };
      input.click();
    } else {
      const data = await AsyncStorage.getItem('pendoo_export');
      if (!data) { Alert.alert('No backup', 'Export a backup first.'); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.items) { await saveItems(parsed.items); Alert.alert('Imported!', `${parsed.items.length} items restored.`); }
      } catch { Alert.alert('Error', 'Could not import data.'); }
    }
  };

  if (onboarded === null) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9f7' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── ONBOARDING CURTAIN OVERLAY ── */}
      {!onboarded && (
        <Reanimated.View 
          exiting={SlideOutUp.springify().damping(20).stiffness(90)} 
          style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: '#e3eadc' }]}
        >
          <Onboarding onComplete={() => setOnboarded(true)} />
        </Reanimated.View>
      )}

      {/* ── MAIN APP ── */}
      <Reanimated.View style={{ flex: 1 }} entering={FadeIn.delay(200).duration(800)}>
        <SafeAreaView style={s.root}>
          <View style={s.topBar}>
            <View style={s.headerLeft}>
              <View style={s.avatarWrapper}>
                <Image source={AVATAR_SOURCES[avatar] || AVATAR_SOURCES['avatar1']} style={s.avatar} contentFit="cover" />
              </View>
              <Text style={s.logoText}>Pendoo</Text>
            </View>
            <TouchableOpacity onPress={() => setIsSettingsOpen(true)} style={s.settingsBtn}>
              <Settings size={22} color="#4b5563" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={s.pageHeader}>
            <Text style={s.pageTitle}>
              {view === 'dashboard' 
                ? (activeItems.length === 0 ? 'Awaiting clarity.' : 'Pending items.') 
                : 'Past clarity.'}
            </Text>
            <Text style={s.pageSubtitle}>
              {view === 'dashboard' 
                ? (activeItems.length === 0 ? "Nothing pending. That's a peaceful place to be." : "Here is what you're currently waiting on.") 
                : "Your resolved and completed items live here."}
            </Text>
          </View>

          <View style={[StyleSheet.absoluteFill, { zIndex: -1, pointerEvents: 'none', justifyContent: 'flex-end' }]}>
            <Reanimated.View style={[{ width: '100%', backgroundColor: '#e3eadc' }, hillAnimatedStyle]}>
              <DashboardHillCurve />
            </Reanimated.View>
          </View>

          {view === 'dashboard' && activeItems.length === 0 ? (
            <Reanimated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={s.emptyState}>
              <View style={s.emptyTop}>
                <Image source={require('../../assets/images/pics/pip_home.png')} style={s.emptyImg} contentFit="contain" />
              </View>
              <View style={s.emptyBottom}>
                <Text style={s.emptyTitle}>Nothing pending.</Text>
                <Text style={s.emptyDesc}>Enjoy the quiet.</Text>
                <TouchableOpacity onPress={openCreateModal} style={s.emptyBtn}>
                  <Text style={s.emptyBtnText}>Record a pending item</Text>
                </TouchableOpacity>
              </View>
            </Reanimated.View>
          ) : view === 'history' && completedItems.length === 0 ? (
            <Reanimated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={s.emptyState}>
              <View style={s.emptyTop}>
                <Image source={require('../../assets/images/pics/pip_history.png')} style={s.emptyImg} contentFit="contain" />
              </View>
              <View style={s.emptyBottom}>
                <Text style={s.emptyTitle}>No resolved items.</Text>
                <Text style={s.emptyDesc}>Your completed items will live here.</Text>
              </View>
            </Reanimated.View>
          ) : (
            <ScrollView style={s.list} contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              {view === 'dashboard' ? (
                <Reanimated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
                  {activeItems.map(item => {
                    const today = startOfDay(new Date());
                    const targetDateStr = item.targetDate || item.followUpDate;
                    
                    let daysValue = 0;
                    let daysLabel = 'WAITING';
                    let circleColor = '#f3f4f6';
                    let numColor = '#1f2937';

                    if (item.dateType === 'expected' && targetDateStr) {
                      const targetDate = startOfDay(parseISO(targetDateStr));
                      const diff = differenceInDays(targetDate, today);
                      
                      if (diff < 0) {
                        daysValue = Math.abs(diff);
                        daysLabel = 'OVERDUE';
                        circleColor = '#fee2e2';
                        numColor = '#dc2626';
                      } else if (diff === 0) {
                        daysValue = 0;
                        daysLabel = 'TODAY';
                        circleColor = '#fef3c7';
                        numColor = '#d97706';
                      } else {
                        daysValue = diff;
                        daysLabel = 'LEFT';
                        circleColor = '#e0e7ff';
                        numColor = '#4f46e5';
                      }
                    } else {
                      daysValue = differenceInDays(today, startOfDay(parseISO(item.createdAt)));
                    }

                    return (
                      <TouchableOpacity key={item.id} style={s.card} onPress={() => setSelectedItem(item)}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={s.chip}><Text style={s.chipText}>{item.category.toUpperCase()}</Text></View>
                          </View>
                          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                          {(item.targetDate || item.followUpDate) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
                              {item.dateType === 'expected' ? <Clock size={12} color="#9ca3af" /> : <Calendar size={12} color="#9ca3af" />}
                              <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600' }}>
                                {item.dateType === 'expected' ? 'Due' : 'Follow up'}: {format(parseISO((item.targetDate || item.followUpDate)!), 'MMM d')}
                              </Text>
                            </View>
                          )}
                        </View>
                        {item.dateType === 'expected' && item.targetDate ? (
                          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <View style={[s.daysCircle, { borderColor: circleColor }]}>
                              <Text style={[s.daysCircleNum, { color: numColor }]}>{daysValue}</Text>
                            </View>
                            <Text style={[s.daysCircleLabel, numColor !== '#1f2937' && { color: numColor }]}>{daysLabel}</Text>
                          </View>
                        ) : (
                          <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1f2937' }}>{daysValue}</Text>
                            <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>WAITING</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </Reanimated.View>
              ) : (
                <Reanimated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
                  {completedItems.map(item => (
                    <TouchableOpacity key={item.id} style={[s.card, { opacity: 0.8 }]} onPress={() => setSelectedItem(item)}>
                      <View style={{ flex: 1, paddingRight: 16 }}>
                        <View style={s.chip}><Text style={s.chipText}>{item.category.toUpperCase()}</Text></View>
                        <Text style={[s.cardTitle, { color: '#9ca3af', textDecorationLine: 'line-through' }]} numberOfLines={2}>{item.title}</Text>
                        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                          Resolved {format(parseISO(item.completedAt!), 'MMM d, yyyy')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <View style={[s.daysCircle, { borderColor: '#d1fae5', backgroundColor: '#ecfdf5' }]}>
                          <Text style={[s.daysCircleNum, { color: '#10b981' }]}>
                            {differenceInDays(parseISO(item.completedAt!), parseISO(item.createdAt))}
                          </Text>
                        </View>
                        <Text style={s.daysCircleLabel}>WAITED</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Reanimated.View>
              )}
            </ScrollView>
          )}

          <View style={s.bottomNav}>
            <View style={s.navPill}>
              <AnimatedTab icon={History} label="History" isActive={view === 'history'} onPress={() => handleSwitchView('history')} />
              <AnimatedTab icon={Home} label="Home" isActive={view === 'dashboard'} onPress={() => handleSwitchView('dashboard')} />
            </View>
            <TouchableOpacity onPress={openCreateModal} style={s.fab}>
              <Plus size={28} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Reanimated.View>

      <Modal visible={isCreating} transparent animationType="fade">
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.createModalContainer}>
          <View style={s.createModalSheet}>
            <View style={s.createHeader}>
              <TouchableOpacity onPress={() => setIsCreating(false)}><Text style={s.createCancelText}>Cancel</Text></TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#9ca3af' }}>{isEditing ? 'Edit Item' : 'New Item'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={!title.trim()} style={[s.createSaveBtn, !title.trim() && { opacity: 0.5 }]}><Text style={s.createSaveText}>Save</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput value={title} onChangeText={setTitle} placeholder="I am waiting for..." placeholderTextColor="#9ca3af" style={s.massiveInput} multiline autoFocus />
              <View style={s.catWrap}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.iosChip, category === c && s.iosChipActive]}>
                    <Text style={[s.iosChipText, category === c && s.iosChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.addNotesBtn}>
                <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowDatePicker(!showDatePicker); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Calendar size={16} color={targetDate ? '#456259' : '#6b7280'} strokeWidth={2.5} />
                  <Text style={[s.addNotesText, targetDate && { color: '#456259', fontWeight: '600' }]}>
                    {targetDate ? (dateType === 'expected' ? `Expected: ${format(targetDate, 'MMM d, yyyy')}` : `Follow up: ${format(targetDate, 'MMM d, yyyy')}`) : 'Set target date'}
                  </Text>
                </TouchableOpacity>
                {targetDate ? (
                  <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setTargetDate(null); setShowDatePicker(false); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <X size={16} color="#9ca3af" strokeWidth={2.5} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowDatePicker(!showDatePicker); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <ChevronRight size={16} color="#9ca3af" strokeWidth={2.5} style={{ transform: [{ rotate: showDatePicker ? '90deg' : '0deg' }] }} />
                  </TouchableOpacity>
                )}
              </View>
              {showDatePicker && (
                <View>
                  <View style={s.dateToggleContainer}>
                    <TouchableOpacity onPress={() => setDateType('followUp')} style={[s.dateTypeBtn, dateType === 'followUp' && s.dateTypeBtnActive]}><Text style={[s.dateTypeText, dateType === 'followUp' && s.dateTypeTextActive]}>Follow Up</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setDateType('expected')} style={[s.dateTypeBtn, dateType === 'expected' && s.dateTypeBtnActive]}><Text style={[s.dateTypeText, dateType === 'expected' && s.dateTypeTextActive]}>Expected</Text></TouchableOpacity>
                  </View>
                  <InlineCalendar value={targetDate} onChange={(date) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easing); setTargetDate(date); setShowDatePicker(false); }} />
                </View>
              )}
              <View style={s.addNotesBtn}>
                <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowNotes(!showNotes); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Plus size={16} color={notes.trim() ? '#456259' : '#6b7280'} strokeWidth={2.5} />
                  <Text style={[s.addNotesText, notes.trim() && { color: '#456259', fontWeight: '600' }]}>{notes.trim() ? 'Details added' : 'Add details'}</Text>
                </TouchableOpacity>
                {notes.trim() ? (
                  <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setNotes(''); setShowNotes(false); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <X size={16} color="#9ca3af" strokeWidth={2.5} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowNotes(!showNotes); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <ChevronRight size={16} color="#9ca3af" strokeWidth={2.5} style={{ transform: [{ rotate: showNotes ? '90deg' : '0deg' }] }} />
                  </TouchableOpacity>
                )}
              </View>
              {showNotes && <TextInput value={notes} onChangeText={setNotes} placeholder="Extra details..." multiline style={s.notesInputIos} placeholderTextColor="#9ca3af" textAlignVertical="top" />}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!selectedItem} transparent animationType="fade">
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.createModalContainer}>
          <View style={s.createModalSheet}>
            <View style={s.createHeader}><Text style={{ fontSize: 17, fontWeight: '600', color: '#9ca3af' }}>Item Details</Text><TouchableOpacity onPress={() => setSelectedItem(null)} style={s.closeBtn}><X size={18} color="#6b7280" strokeWidth={2.5} /></TouchableOpacity></View>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 24, alignItems: 'center', marginTop: 10 }}>
                  <View style={{ backgroundColor: '#f0f9f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16 }}><Text style={{ fontSize: 12, color: '#456259', fontWeight: '700', letterSpacing: 0.5 }}>{selectedItem.category.toUpperCase()}</Text></View>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: '#1f2937', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>{selectedItem.title}</Text>
                </View>
                {selectedItem.notes ? (<View style={{ marginBottom: 24, backgroundColor: '#f9fafb', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f3f4f6' }}><Text style={{ fontSize: 16, color: '#4b5563', lineHeight: 24 }}>{selectedItem.notes}</Text></View>) : <View style={{ height: 8 }} />}
                <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 999, padding: 6 }}>
                  <TouchableOpacity onPress={() => deleteItem(selectedItem.id)} style={[s.actionPillBtn, { width: 52, backgroundColor: '#fef2f2' }]}><Trash2 size={18} color="#dc2626" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditModal(selectedItem)} style={[s.actionPillBtn, { width: 52, backgroundColor: 'transparent' }]}><Pencil size={18} color="#6b7280" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleItemStatus(selectedItem.id)} style={[s.actionPillBtn, { flex: 1, backgroundColor: selectedItem.completedAt ? '#e5e7eb' : '#456259' }]}>{selectedItem.completedAt ? <RotateCcw size={18} color="#4b5563" /> : <CheckCircle size={18} color="#fff" />}<Text style={[s.smallActionBtnText, selectedItem.completedAt ? { color: '#4b5563' } : { color: '#fff' }]}>{selectedItem.completedAt ? 'Reopen' : 'Resolve'}</Text></TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isSettingsOpen} transparent animationType="fade">
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.settingsModalContainer}>
          <View style={s.settingsCard}>
            <View style={s.settingsHeader}><Text style={s.settingsTitle}>Settings</Text><TouchableOpacity onPress={() => setIsSettingsOpen(false)} style={s.closeBtn}><X size={18} color="#6b7280" strokeWidth={2.5} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.settingsGroupLabel}>DATA MANAGEMENT</Text>
              <View style={s.settingsGroupBlock}>
                <TouchableOpacity style={s.settingsRowIos} onPress={handleExport}><View style={[s.settingsIconIos, { backgroundColor: '#e8f0ee' }]}><Download size={18} color="#456259" strokeWidth={2.5} /></View><Text style={s.settingsRowTitleIos}>Export Backup</Text></TouchableOpacity>
                <View style={s.settingsDivider} />
                <TouchableOpacity style={s.settingsRowIos} onPress={handleImport}><View style={[s.settingsIconIos, { backgroundColor: '#e8f0ee' }]}><Upload size={18} color="#456259" strokeWidth={2.5} /></View><Text style={s.settingsRowTitleIos}>Import Backup</Text></TouchableOpacity>
              </View>
              <Text style={s.settingsGroupLabel}>APP PREFERENCES</Text>
              <View style={s.settingsGroupBlock}>
                <TouchableOpacity style={s.settingsRowIos} onPress={async () => { await AsyncStorage.removeItem('pendoo_onboarded'); setIsSettingsOpen(false); setOnboarded(false); }}><View style={[s.settingsIconIos, { backgroundColor: '#f3f4f6' }]}><RotateCcw size={18} color="#6b7280" strokeWidth={2.5} /></View><Text style={s.settingsRowTitleIos}>Replay Onboarding</Text></TouchableOpacity>
                <View style={s.settingsDivider} />
                <TouchableOpacity style={s.settingsRowIos} onPress={() => setShowDeleteConfirm(true)}><View style={[s.settingsIconIos, { backgroundColor: '#fef2f2' }]}><Trash2 size={18} color="#dc2626" strokeWidth={2.5} /></View><Text style={[s.settingsRowTitleIos, { color: '#dc2626' }]}>Wipe All Data</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DELETE CONFIRMATION POPUP ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', width: '100%', maxWidth: 360 }}>
            <View style={{ padding: 28, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Trash2 size={26} color="#dc2626" strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>Wipe All Data?</Text>
              <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>This will permanently delete all your pending and completed items. This cannot be undone.</Text>
            </View>
            <TouchableOpacity
              onPress={() => { saveItems([]); setShowDeleteConfirm(false); setIsSettingsOpen(false); }}
              style={{ padding: 18, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#dc2626' }}>Delete Everything</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(false)}
              style={{ padding: 18, alignItems: 'center' }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: 17, color: '#456259', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf9f7', overflow: 'hidden' },
  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#faf9f7', borderBottomWidth: 1, borderBottomColor: '#f0eeeb' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0eeeb', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1a1c1b', letterSpacing: -0.5 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'flex-end', justifyContent: 'center' },

  // Typography Header
  pageHeader: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 32 },
  pageTitle: { fontSize: 42, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#1a1c1b', marginBottom: 12, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 17, color: '#6b7280', lineHeight: 24, paddingRight: 30 },

  // Empty State
  emptyState: { flex: 1, flexDirection: 'column' },
  emptyTop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBottom: { flex: 1, alignItems: 'center', paddingTop: 16 },
  emptyImg: { width: 240, height: 240, alignSelf: 'center' },
  emptyTextBlock: { alignItems: 'center' },
  emptyTitle: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 28, color: '#1a1c1b', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 16, color: '#414845', opacity: 0.8, marginBottom: 28, textAlign: 'center' },
  emptyBtn: { backgroundColor: 'rgba(255,255,255,0.75)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  emptyBtnText: { color: '#2E4C41', fontWeight: '700', fontSize: 15 },

  // List
  list: { flex: 1 },

  // Card
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 12, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  chip: { backgroundColor: '#e8f0ee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  chipText: { fontSize: 10, fontWeight: '800', color: '#456259', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1f2937', marginTop: 12, lineHeight: 22 },
  daysCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  daysCircleNum: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  daysCircleLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', marginTop: 6, letterSpacing: 1 },
  addNotesBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  addNotesText: { marginLeft: 12, fontSize: 16, color: '#6b7280', flex: 1 },

  // Bottom nav
  bottomNav: { position: 'absolute', bottom: 28, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navPill: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#f0eeeb', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  navBtn: { flexDirection: 'row', alignItems: 'center', height: 40, borderRadius: 20 },
  navBtnActive: { backgroundColor: '#456259' },
  navBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  navBtnTextActive: { color: '#fff' },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#456259', alignItems: 'center', justifyContent: 'center', shadowColor: '#456259', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#faf9f7', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#456259' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

  // iOS Create Modal
  createModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  createModalSheet: { backgroundColor: '#fff', borderRadius: 32, padding: 24, paddingBottom: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 },
  createHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  createCancelText: { fontSize: 17, color: '#6b7280', fontWeight: '500' },
  createSaveBtn: { backgroundColor: '#456259', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createSaveText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  massiveInput: { fontSize: 32, fontWeight: '700', color: '#1a1c1b', marginBottom: 24, padding: 0 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  iosChip: { backgroundColor: '#f9fafb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#f3f4f6' },
  iosChipActive: { backgroundColor: '#f0f9f6', borderColor: '#456259' },
  iosChipText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  iosChipTextActive: { color: '#456259' },
  notesInputIos: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, fontSize: 16, color: '#374151', minHeight: 100 },

  // iOS Settings Modal
  settingsModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  settingsCard: { backgroundColor: '#f9fafb', borderRadius: 32, padding: 24, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20, maxHeight: '85%' },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  settingsTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  settingsGroupLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.5, marginLeft: 12, marginBottom: 8, marginTop: 16 },
  settingsGroupBlock: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  settingsRowIos: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingsIconIos: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingsRowTitleIos: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1f2937' },
  settingsDivider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 62 },

  // Details Modal Specific
  actionPillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 999, gap: 8 },
  smallActionBtnText: { fontSize: 16, fontWeight: '700' },

  // Date Toggle
  dateToggleContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4, marginHorizontal: 20, marginTop: 12 },
  dateTypeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  dateTypeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  dateTypeText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  dateTypeTextActive: { color: '#1f2937' },
});
