import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const APP_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://micita-production-56e0f4b0.up.railway.app/';

export default function App() {
  const webView = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webView.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.webViewContainer}>
        <WebView
          ref={webView}
          source={{ uri: APP_URL }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#0f8b8d" />
            </View>
          )}
          onNavigationStateChange={(navigation) => setCanGoBack(navigation.canGoBack)}
          onError={() => setHasError(true)}
        />
        {hasError && (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>No se pudo conectar con MiCita</Text>
            <Text style={styles.errorMessage}>Revisá tu conexión e intentá nuevamente.</Text>
            <Pressable style={styles.button} onPress={() => {
              setHasError(false);
              webView.current?.reload();
            }}>
              <Text style={styles.buttonText}>Reintentar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewContainer: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  error: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    color: '#183536',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#526566',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0f8b8d',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
