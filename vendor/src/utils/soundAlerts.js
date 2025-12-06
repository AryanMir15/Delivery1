import { Audio } from 'expo-av';

let sound = null;

export const playOrderSound = async () => {
  try {
    // Load and play a notification sound
    const { sound: newSound } = await Audio.Sound.createAsync(
      // You can add a custom sound file here
      require('../../assets/notification.mp3'),
      { shouldPlay: true }
    );
    sound = newSound;

    // Unload sound after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export const stopSound = async () => {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  }
};
