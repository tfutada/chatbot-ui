import { KeyValuePair } from './data';

export interface Plugin {
  id: PluginID;
  name: PluginName;
  requiredKeys: KeyValuePair[];
}

export interface PluginKey {
  pluginId: PluginID;
  requiredKeys: KeyValuePair[];
}

export enum PluginID {
  GOOGLE_SEARCH = 'google-search',
  QDRANT_SEARCH = 'qdrant-search',
}

export enum PluginName {
  GOOGLE_SEARCH = 'Google Search',
  QDRANT_SEARCH = 'Qdrant Search',
}

export const Plugins: Record<PluginID, Plugin> = {
  [PluginID.GOOGLE_SEARCH]: {
    id: PluginID.GOOGLE_SEARCH,
    name: PluginName.GOOGLE_SEARCH,
    requiredKeys: [
      {
        key: 'GOOGLE_API_KEY',
        value: '',
      },
      {
        key: 'GOOGLE_CSE_ID',
        value: '',
      },
    ],
  },
  [PluginID.QDRANT_SEARCH]: {
    id: PluginID.QDRANT_SEARCH,
    name: PluginName.QDRANT_SEARCH,
    requiredKeys: [],
  }
};

export const PluginList = Object.values(Plugins);
