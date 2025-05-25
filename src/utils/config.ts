import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const CONFIG_FILE_PATH = `${FileSystem.documentDirectory}config.json`;
const CONFIG_API_URL = 'https://example.com/api/config'; // Replace with your actual API URL

interface Config {
  version: number;
  [key: string]: any;
}

let config: Config | null = null;

const loadConfig = async (): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(CONFIG_FILE_PATH);
    if (fileInfo.exists) {
      const configFile = await FileSystem.readAsStringAsync(CONFIG_FILE_PATH);
      config = JSON.parse(configFile);
    } else {
      config = { version: 0 };
    }
  } catch (error) {
    console.error('Error loading config:', error);
    config = { version: 0 };
  }
};

const saveConfig = async (): Promise<void> => {
  try {
    if (config) {
      await FileSystem.writeAsStringAsync(CONFIG_FILE_PATH, JSON.stringify(config), {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (error) {
    console.error('Error saving config:', error);
  }
};

export const checkForConfigUpdates = async (): Promise<void> => {
  try {
    if (!config) {
      await loadConfig();
    }

    const response = await axios.get(`${CONFIG_API_URL}?version=${config?.version}`);
    if (response.data && response.data.version > config?.version) {
      config = response.data;
      await saveConfig();
      console.log('Config updated to version:', config.version);
    } else {
      console.log('Config is up to date.');
    }
  } catch (error) {
    console.error('Error checking for config updates:', error);
  }
};

export const getConfigValue = (key: string): any => {
  if (!config) {
    throw new Error('Config not loaded');
  }
  return config[key];
};

// Initialize config on module load
loadConfig();
