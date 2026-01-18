import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native'
import React, { useRef, useState } from 'react'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

export default function TargetCity() {
  const router = useRouter();
  const params = useLocalSearchParams(); // Access data from index and frequent-places
  const mapRef = useRef<MapView | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newRegion = { ...region, latitude, longitude };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // 1. Retrieve the frequent places we stored in AsyncStorage on page 2
      const storedPlaces = await AsyncStorage.getItem("frequent-places");
      const preferencePlaces = storedPlaces ? JSON.parse(storedPlaces) : [];

      // 2. Construct the exact JSON payload
      const payload = {
        sourceLocation: {
          latitude: parseFloat(params.latitude as string),
          longitude: parseFloat(params.longitude as string),
        },
        preferencePlaces: preferencePlaces.map((p: any) => ({
          name: p.name,
          category: p.category.toLowerCase(),
          latitude: p.latitude,
          longitude: p.longitude,
        })),
        targetLocation: {
          latitude: region.latitude,
          longitude: region.longitude,
        },
      };

      // 3. Send to Backend
      const response = await fetch('https://your-api-endpoint.com/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.multiRemove(["frequent-places", "frequent-places-draft"]);
        
        router.push({
          pathname: "/recommendations", // Your 4th page
          params: { results: JSON.stringify(data) } 
        });
      } else {
        Alert.alert("Error", "Failed to fetch recommendations from server.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <GooglePlacesAutocomplete
          placeholder='Search for Destination City'
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (!details) return;
            const { lat, lng } = details.geometry.location;
            const newRegion = { ...region, latitude: lat, longitude: lng };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 800);
          }}
          query={{
            key: "YOUR_GOOGLE_MAPS_API_KEY",
            language: "en",
          }}
        />
      </View>

      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        onRegionChangeComplete={setRegion}
      />

      <View pointerEvents="none" style={styles.centerPinWrapper}>
        <View style={styles.centerPinOuter}>
          <View style={styles.centerPinInner} />
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <TouchableOpacity style={styles.useLocationBtn} onPress={getCurrentLocation}>
          <Ionicons name="locate-outline" size={20} color="#111827" />
          <Text style={styles.useLocationText}>Use Current Location</Text>
        </TouchableOpacity>
        
        <Text style={styles.coordsText}>
          TARGET: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
        </Text>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>Get Recommendations</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  map: {
    flex: 1,
  },

  searchBox: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 20,
    width: "90%",
    alignSelf: "center",
    zIndex: 15,
  },

  centerPinWrapper: {
    position: "absolute",
    top: height / 2 - 32,
    left: width / 2 - 16,
    zIndex: 5,
    alignItems: "center",
  },
  centerPinOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F766E",
    justifyContent: "center",
    alignItems: "center",
  },
  centerPinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },

  // mapControls: {
  //   position: "absolute",
  //   right: 18,
  //   top: height / 2 - 40,
  //   zIndex: 10,
  // },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  useLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  useLocationText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  coordsText: {
    textAlign: "center",
    marginBottom: 14,
    color: "#6B7280",
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: "#0F766E",
    paddingVertical: 16,
    borderRadius: 999,
  },
  confirmText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
