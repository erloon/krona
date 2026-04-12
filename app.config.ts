import type { ExpoConfig, ConfigContext } from 'expo/config';

type AppVariant = 'development' | 'preview' | 'production';

const getAppVariant = (): AppVariant => {
  const variant = process.env.APP_VARIANT;

  if (variant === 'development' || variant === 'preview' || variant === 'production') {
    return variant;
  }

  return 'production';
};

const getVariantConfig = (variant: AppVariant) => {
  switch (variant) {
    case 'development':
      return {
        appName: 'krona Dev',
        bundleId: 'com.sparkdatapl.krona.dev',
        scheme: 'krona-dev',
      };
    case 'preview':
      return {
        appName: 'krona Preview',
        bundleId: 'com.sparkdatapl.krona.preview',
        scheme: 'krona-preview',
      };
    case 'production':
    default:
      return {
        appName: 'krona',
        bundleId: 'com.sparkdatapl.krona',
        scheme: 'krona',
      };
  }
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getAppVariant();
  const { appName, bundleId, scheme } = getVariantConfig(variant);

  return {
    ...config,
    name: appName,
    slug: 'krona',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    scheme,
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/images/logo.png',
      bundleIdentifier: bundleId,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/logo.png',
      },
      predictiveBackGestureEnabled: false,
      package: bundleId,
    },
    web: {
      output: 'static',
      favicon: './assets/images/logo.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#faf9f8',
          android: {
            image: './assets/images/logo.png',
            imageWidth: 96,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      appVariant: variant,
      eas: {
        projectId: '57fecdc1-f062-4b77-adae-fe9e06c3d051',
      },
    },
    owner: 'sparkdatapl',
  };
};
