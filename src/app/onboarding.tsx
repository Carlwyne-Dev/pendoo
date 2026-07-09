import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const TOP_HALF = height * 0.5;

const AVATARS = Array.from({ length: 9 }, (_, i) => `avatar${i + 1}`);
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

const STEPS = [
  { image: require('../../assets/images/pics/onboarding_pendoo.png'), title: 'Welcome to Pendoo', desc: 'Your quiet queue for things you are waiting on. Free your mind from holding onto pending tasks.' },
  { image: require('../../assets/images/pics/onboarding_2.png'), title: 'Track the wait', desc: 'Log items, set follow-up dates, and see exactly how long you have been waiting at a glance.' },
  { image: require('../../assets/images/pics/onboarding_3.png'), title: 'Peace of mind', desc: 'No accounts, no cloud. Everything stays privately on your device.' },
  { isAvatar: true, title: 'Pick your companion', desc: 'You can change this anytime.' },
];

function HillCurve() {
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

export default function Onboarding({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState('avatar1');

  // White panel slide (for hill → avatar transition)
  const whitePanelY = useRef(new Animated.Value(0)).current;

  // Content animations
  const imgOpacity = useRef(new Animated.Value(1)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const imgTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textTranslateY = useRef(new Animated.Value(0)).current;

  const animateContentOut = () => new Promise<void>(resolve => {
    Animated.parallel([
      Animated.timing(imgOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(imgScale, { toValue: 0.82, duration: 160, useNativeDriver: true }),
      Animated.timing(imgTranslateY, { toValue: 16, duration: 160, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 10, duration: 120, useNativeDriver: true }),
    ]).start(() => resolve());
  });

  const animateContentIn = () => {
    imgOpacity.setValue(0);
    imgScale.setValue(0.82);
    imgTranslateY.setValue(-24);
    textOpacity.setValue(0);
    textTranslateY.setValue(18);
    Animated.parallel([
      Animated.spring(imgOpacity, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
      Animated.spring(imgScale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
      Animated.spring(imgTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 8 }),
      Animated.sequence([Animated.delay(70), Animated.spring(textOpacity, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 })]),
      Animated.sequence([Animated.delay(70), Animated.spring(textTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 8 })]),
    ]).start();
  };

  const goToStep = async (nextStep: number) => {
    const enteringAvatar = nextStep === STEPS.length - 1;
    const leavingAvatar = step === STEPS.length - 1;

    await animateContentOut();

    if (enteringAvatar) {
      // Slide white panel UP before showing avatar step
      setStep(nextStep);
      Animated.spring(whitePanelY, {
        toValue: -TOP_HALF,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start(() => animateContentIn());
    } else if (leavingAvatar) {
      // Slide white panel DOWN before showing image step
      Animated.spring(whitePanelY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start(() => {
        setStep(nextStep);
        animateContentIn();
      });
    } else {
      setStep(nextStep);
      animateContentIn();
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('pendoo_onboarded', '1');
    await AsyncStorage.setItem('pendoo_avatar', avatar);
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/');
    }
  };

  const current = STEPS[step];
  const isAvatarStep = !!current.isAvatar;
  const avatarSize = (width - 80) / 3;

  return (
    <SafeAreaView style={s.root}>

      {/* ── STATIC BACKGROUND ── */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
        {/* Green fills everything */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: '#e3eadc' }} />
        </View>
        {/* White panel that slides up */}
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: TOP_HALF,
          backgroundColor: '#faf9f7',
          transform: [{ translateY: whitePanelY }],
        }} />
        {/* Hill curve sits at the boundary */}
        <Animated.View style={{
          position: 'absolute',
          top: TOP_HALF,
          left: 0,
          right: 0,
          height: 1,
          transform: [{ translateY: whitePanelY }],
        }}>
          <HillCurve />
        </Animated.View>
      </View>

      {/* ── CONTENT ── */}
      <View style={[s.flex, { zIndex: 1 }]}>
        {!isAvatarStep ? (
          /* Image steps */
          <>
            <View style={s.topArea}>
              <Animated.View style={{
                opacity: imgOpacity,
                transform: [{ scale: imgScale }, { translateY: imgTranslateY }]
              }}>
                <Image source={current.image} style={s.heroImg} contentFit="contain" />
              </Animated.View>
            </View>
            <Animated.View style={[s.bottomArea, {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }]
            }]}>
              <Text style={s.h2}>{current.title}</Text>
              <Text style={s.desc}>{current.desc}</Text>
            </Animated.View>
          </>
        ) : (
          /* Avatar step */
          <Animated.View style={[s.flex, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
          {/* Text + grid as one centered block */}
          <View style={s.avatarContent}>
            <View style={s.avatarHeader}>
              <Text style={s.h2}>{current.title}</Text>
              <Text style={s.desc}>{current.desc}</Text>
            </View>
            <View style={s.avatarGrid}>
              {AVATARS.map((av) => (
                <TouchableOpacity key={av} onPress={() => setAvatar(av)}
                  style={[s.avatarBtn, {
                    width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
                    borderColor: av === avatar ? '#456259' : 'rgba(0,0,0,0.08)',
                    borderWidth: av === avatar ? 3 : 1.5,
                    transform: [{ scale: av === avatar ? 1.06 : 1 }],
                  }]}>
                  <Image source={AVATAR_SOURCES[av]} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
        )}
      </View>

      {/* ── BOTTOM BAR ── */}
      <View style={s.bottomBar}>
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, {
              width: step === i ? 20 : 6,
              backgroundColor: step === i ? '#2E4C41' : 'rgba(46,76,65,0.3)'
            }]} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => goToStep(step - 1)} style={{ padding: 12, marginLeft: -12 }}>
              <Text style={{ color: '#456259', fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>BACK</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 60 }} />}
          <TouchableOpacity onPress={() => step < STEPS.length - 1 ? goToStep(step + 1) : handleComplete()} style={s.cta}>
            <Text style={s.ctaTxt}>{step < STEPS.length - 1 ? 'NEXT' : 'GET STARTED'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e3eadc', overflow: 'hidden' },
  flex: { flex: 1, overflow: 'hidden' },

  topArea: {
    height: '50%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroImg: {
    width: 260,
    height: 260,
    marginBottom: -80,
  },
  bottomArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },

  avatarContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  avatarHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarBtn: { overflow: 'hidden' },

  h2: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 34,
    fontWeight: '400',
    color: '#1a1c1b',
    marginBottom: 14,
    textAlign: 'center',
  },
  desc: {
    fontSize: 16,
    color: '#414845',
    opacity: 0.85,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 300,
  },

  bottomBar: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#e3eadc',
    zIndex: 2,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 6, borderRadius: 999 },
  cta: {
    backgroundColor: '#456259',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#456259',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
});
