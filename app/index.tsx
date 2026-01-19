// app/index.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCityFromCoord } from "./utils/location";

const { width, height } = Dimensions.get("window");

export default function SetLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const savePreviousCity = async () => {
    const cityName = await getCityFromCoord(region.latitude, region.longitude);
    try {
      await AsyncStorage.setItem(
        "previous_city", 
        JSON.stringify({
          name: cityName,  // Or get from autocomplete
          coordinates: {
            lat: region.latitude,
            lng: region.longitude,
          },
        })
      );
      console.log("✅ SAVED previous_city:", region.latitude, region.longitude);
    } catch (error) {
      console.error("❌ Storage error:", error);
      Alert.alert("Error", "Failed to save location");
    }
  };

  // get current device location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newRegion = {
      ...region,
      latitude,
      longitude,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleConfirm = () => {
  if (params.mode === "place") {
    router.replace({
      pathname: (params.returnTo as string) || "/frequent-places",
      params: {
        placeLat: String(region.latitude),
        placeLng: String(region.longitude),
      },
    });
    return;
  }
  // save current location as previous_city
  savePreviousCity()
  // normal flow if user opened app fresh
  router.push({
    pathname: "/frequent-places",
    params: {
      latitude: region.latitude,
      longitude: region.longitude,
    },
  });
};


  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBox}>
        <GooglePlacesAutocomplete
          placeholder="Search for a location"
          fetchDetails
          enablePoweredByContainer={false}
          onPress={(data, details = null) => {
            if (!details) return;
            const { lat, lng } = details.geometry.location;

            const newRegion = {
              ...region,
              latitude: lat,
              longitude: lng,
            };

            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 800);
          }}
          query={{
            key: "YOUR_GOOGLE_MAPS_API_KEY",
            language: "en",
          }}
          styles={{
            textInputContainer: {
              borderRadius: 28,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 10,
              paddingVertical: Platform.OS === "ios" ? 10 : 0,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            },
            textInput: {
              height: 44,
              borderRadius: 24,
              fontSize: 16,
              color: "#111827",
            },
            listView: {
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              marginTop: 8,
            },
          }}
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      />

      {/* Center pin (overlay) */}
      <View pointerEvents="none" style={styles.centerPinWrapper}>
        <View style={styles.centerPinOuter}>
          <View style={styles.centerPinInner} />
        </View>
      </View>

      {/* Zoom & current location controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() =>
            mapRef.current?.animateToRegion(
              {
                ...region,
                latitudeDelta: region.latitudeDelta * 0.7,
                longitudeDelta: region.longitudeDelta * 0.7,
              },
              200
            )
          }
        >
          <Ionicons name="add" size={20} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() =>
            mapRef.current?.animateToRegion(
              {
                ...region,
                latitudeDelta: region.latitudeDelta / 0.7,
                longitudeDelta: region.longitudeDelta / 0.7,
              },
              200
            )
          }
        >
          <Ionicons name="remove" size={20} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={getCurrentLocation}>
          <Ionicons name="locate" size={20} color="#0F766E" />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <TouchableOpacity style={styles.useLocationBtn} onPress={getCurrentLocation}>
          <Ionicons name="navigate" size={18} color="#0F766E" />
          <Text style={styles.useLocationText}>Use my current location</Text>
        </TouchableOpacity>

        <Text style={styles.coordsText}>
          LAT: {region.latitude.toFixed(4)}, LONG: {region.longitude.toFixed(4)}
        </Text>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
    justifyContent: "center",
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
    width,
    height,
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

  mapControls: {
    position: "absolute",
    right: 18,
    top: height / 2 - 40,
    zIndex: 10,
  },
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
