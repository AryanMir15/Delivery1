let sound = null;

export const playOrderSound = async () => {
  // TODO: Add notification.mp3 to mobile/assets/ and uncomment
  // const { Audio } = require('expo-av');
  // const { sound: newSound } = await Audio.Sound.createAsync(
  //   require('../../assets/notification.mp3'),
  //   { shouldPlay: true }
  // );
  // sound = newSound;
  // sound.setOnPlaybackStatusUpdate((status) => {
  //   if (status.didJustFinish) sound.unloadAsync();
  // });
};

export const stopSound = async () => {
  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {}
    sound = null;
  }
};
