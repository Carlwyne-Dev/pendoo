import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, parseISO } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

const CATEGORIES = ['Work', 'Personal', 'Financial', 'Medical', 'Home', 'Learning', 'General'];

export default function App() {
  const [items, setItems] = useState([]);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [avatar, setAvatar] = useState('avatar1');
  const [view, setView] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const savedItems = await AsyncStorage.getItem('pendoo_items');
      if (savedItems) setItems(JSON.parse(savedItems));
    };
    loadData();
  }, []);

  const saveItems = async (newItems) => {
    setItems(newItems);
    await AsyncStorage.setItem('pendoo_items', JSON.stringify(newItems));
  };

  const activeItems = items.filter(i => !i.completedAt).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedItems = items.filter(i => i.completedAt).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  const handleSave = () => {
    if (!title.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      notes,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    saveItems([newItem, ...items]);
    setIsCreating(false);
    setTitle('');
    setNotes('');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#EEF1EC]">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Bar */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-[#faf9f7] border-b border-gray-200">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white items-center justify-center">
            <Image source={require('../assets/images/pics/avatar1.png')} className="w-full h-full" resizeMode="cover" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-[#456259]">Pendoo</Text>
        </View>
        <TouchableOpacity onPress={() => setIsSettingsOpen(true)}>
          <Text className="text-gray-500 text-2xl">⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {view === 'dashboard' ? (
          activeItems.length === 0 ? (
            <View className="items-center mt-10">
              <Image source={require('../assets/images/pics/pip_home.png')} className="w-48 h-48" resizeMode="contain" />
              <Text className="text-2xl font-bold text-gray-800 mt-6">Nothing pending.</Text>
              <Text className="text-base text-gray-500 mt-2 mb-8">Enjoy the quiet.</Text>
              <TouchableOpacity 
                onPress={() => setIsCreating(true)}
                className="px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm"
              >
                <Text className="text-[#456259] font-bold">Record a pending item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                className="bg-white rounded-3xl p-5 flex-row justify-between items-center shadow-sm mb-4"
                onPress={() => {
                  const newItems = items.map(i => i.id === item.id ? { ...i, completedAt: new Date().toISOString() } : i);
                  saveItems(newItems);
                }}
              >
                <View>
                  <View className="bg-[#456259]/10 px-3 py-1 rounded-full self-start mb-2">
                    <Text className="text-xs font-bold text-[#456259]">{item.category}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-3xl font-bold text-[#456259]">
                    {differenceInDays(new Date(), parseISO(item.createdAt))}
                  </Text>
                  <Text className="text-xs text-gray-400">days</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          completedItems.length === 0 ? (
            <View className="items-center mt-10">
              <Image source={require('../assets/images/pics/pip_history.png')} className="w-48 h-48" resizeMode="contain" />
              <Text className="text-xl font-bold text-gray-800 mt-6">No resolved items yet.</Text>
            </View>
          ) : (
            completedItems.map((item) => (
              <View key={item.id} className="bg-white rounded-3xl p-5 shadow-sm mb-4">
                <Text className="text-lg font-bold text-gray-800 line-through opacity-60">{item.title}</Text>
                <Text className="text-sm text-gray-500 mt-1">Resolved on {format(parseISO(item.completedAt), 'MMM d, yyyy')}</Text>
              </View>
            ))
          )
        )}
        <View className="h-32" />
      </ScrollView>

      {/* Floating Bottom Nav */}
      <View className="absolute bottom-10 left-0 right-0 px-6 flex-row justify-between items-center">
        <View className="bg-white/90 px-2 py-2 rounded-full flex-row space-x-2 border border-gray-200 shadow-sm">
          <TouchableOpacity 
            onPress={() => setView('history')}
            className={`px-4 py-3 rounded-full ${view === 'history' ? 'bg-[#456259]' : ''}`}
          >
            <Text className={view === 'history' ? 'text-white font-bold' : 'text-gray-500'}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setView('dashboard')}
            className={`px-4 py-3 rounded-full ${view === 'dashboard' ? 'bg-[#456259]' : ''}`}
          >
            <Text className={view === 'dashboard' ? 'text-white font-bold' : 'text-gray-500'}>Home</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => setIsCreating(true)}
          className="w-16 h-16 rounded-full bg-[#456259] shadow-lg items-center justify-center"
        >
          <Text className="text-white text-3xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Create Modal */}
      <Modal visible={isCreating} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-[#faf9f7] rounded-t-3xl p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#456259]">Record Item</Text>
              <TouchableOpacity onPress={() => setIsCreating(false)} className="w-10 h-10 items-center justify-center bg-gray-200 rounded-full">
                <Text className="text-gray-500 font-bold">X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-xs font-bold text-[#456259] mb-2 uppercase tracking-widest">Item</Text>
                <TextInput 
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What are you waiting on?"
                  className="bg-white p-4 rounded-2xl border border-gray-200 text-lg shadow-sm"
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-[#456259] mb-2 uppercase tracking-widest">Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <TouchableOpacity 
                      key={c}
                      onPress={() => setCategory(c)}
                      className={`px-4 py-2 rounded-full border ${category === c ? 'bg-[#456259] border-[#456259]' : 'bg-white border-gray-300'}`}
                    >
                      <Text className={category === c ? 'text-white font-bold' : 'text-gray-600'}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-xs font-bold text-[#456259] mb-2 uppercase tracking-widest">Notes</Text>
                <TextInput 
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any context or details..."
                  multiline
                  numberOfLines={4}
                  className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm min-h-[100px]"
                />
              </View>

              <TouchableOpacity 
                onPress={handleSave}
                disabled={!title.trim()}
                className={`w-full py-4 rounded-2xl items-center shadow-md mb-10 ${title.trim() ? 'bg-[#456259]' : 'bg-gray-400'}`}
              >
                <Text className="text-white font-bold text-base uppercase tracking-wider">Record Pending Item</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={isSettingsOpen} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/40 px-6">
          <View className="bg-[#faf9f7] rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#456259]">Settings</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)} className="w-8 h-8 items-center justify-center bg-gray-200 rounded-full">
                <Text className="text-gray-500 font-bold">X</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => saveItems([])}
              className="bg-red-50 p-4 rounded-2xl border border-red-200 flex-row justify-between items-center"
            >
              <View>
                <Text className="font-bold text-red-600 text-lg">Wipe All Data</Text>
                <Text className="text-red-400 text-sm">Permanently delete everything</Text>
              </View>
              <Text className="text-red-600 text-xl">🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
