/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import _ from 'lodash';
import {
  check,
  PERMISSIONS,
  RESULTS,
  requestMultiple,
} from 'react-native-permissions';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {stringToBytes} from 'convert-string';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

import {useEffect, useState} from 'react';

import BleManager, {scan} from 'react-native-ble-manager';

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';

  // useEffect(() => {
  //   scanBle();
  // }, []);

  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [peripherals, setPeripherals] = useState([]);
  const [isBleConnected, setIsBleConnected] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const bleFunc = () => {
    console.log('#________');
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );

    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);

    scanForDevices(); // I chose to start scanning for devices here
  };

  async function connectAndPrepare(peripheral, service, characteristic) {
    // Connect to device
    await BleManager.connect(peripheral);
    // Before startNotification you need to call retrieveServices
    await BleManager.retrieveServices(peripheral);
    // To enable BleManagerDidUpdateValueForCharacteristic listener
    await BleManager.startNotification(peripheral, service, characteristic);
    // Add event listener
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({value, peripheral, characteristic, service}) => {
        // Convert bytes array to string
        const data = bytesToString(value);
        console.log(`Recieved ${data} for characteristic ${characteristic}`);
      },
    );
    // Actions triggereng BleManagerDidUpdateValueForCharacteristic event
  }

  const scanForDevices = () => {
    BleManager.scan([], 15);
  };

  const handleDiscoverPeripheral = peripheral => {
    // const {peripherals} = this.state;
    // console.log(peripheral);
    const tmp = peripherals;
    console.log('#####');
    if (peripheral.name) {
      console.log('peripheral', peripheral);
      peripherals.push({});
      tmp.push({id: peripheral.id, name: peripheral.name, peripheral});
      connectBle();
    }
    setPeripherals(tmp);
  };

  const handleStopScan = () => {
    console.log('Scan is stopped. Devices: ', this.state.peripherals);
  };

  const connectBle = () => {
    console.log('connect ble');
    BleManager.connect('40:D6:3C:00:14:CB')
      .then(() => {
        // Success code
        setIsBleConnected(true);
        console.log('Connected');
        BleManager.retrieveServices('40:D6:3C:00:14:CB').then(
          peripheralInfo => {
            // Success code
            console.log('Peripheral info:', peripheralInfo);
            startNotification();
          },
        );
      })
      .catch(error => {
        // Failure code
        console.log(error);
      });
  };

  const startNotification = () => {
    console.log(stringToBytes('IN;PA;PU0,0;PD0,4000;PU0,0;!PG'));
    BleManager.requestMTU('40:D6:3C:00:14:CB', 400)
      .then(mtu => {
        // Success code
        console.log('MTU size changed to ' + mtu + ' bytes');
        BleManager.writeWithoutResponse(
          '40:D6:3C:00:14:CB',
          '1800',
          '2a00',
          stringToBytes('5AA5AA00130000691D0D0A'),
        )
          .then(e => {
            // Success code
            console.log('e', e);
          })
          .catch(error => {
            // Failure code
            console.log(error);
          });
      })
      .catch(error => {
        // Failure code
        console.log(error);
      });
  };

  useEffect(() => {
    if (isBleConnected) {
      startNotification();
    }
  }, [isBleConnected]);

  useEffect(() => {
    requestMultiple([
      PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION,
      PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.BLUETOOTH,
      PERMISSIONS.ANDROID.BLUETOOTH_ADMIN,
    ]).then(statuses => {
      console.log('statuses', statuses);
    });
    bleFunc();
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.js</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
