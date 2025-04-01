import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SectionList, Pressable, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobTemplateDataStore } from '@/stores/jobTemplateDataStore';
import { JobTemplateData } from '@/models/types';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ItemData {
  id: string;
  code: number;
  title: string;
  isActive: boolean;
}

interface SectionData {
  id: string;
  code: number;
  title: string;
  data: ItemData[];
  isExpanded: boolean;
}

const JobTemplatesConfigurationScreen: React.FC = () => {
  const { templateId } = useLocalSearchParams();
  const { allJobTemplates } = useJobTemplateDataStore();
  const [template, setTemplate] = useState<JobTemplateData | null>();

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (templateId) {
      const fetchedTemplate = allJobTemplates.find((c) => c._id === templateId);
      setTemplate(fetchedTemplate || null);
    }
  }, [templateId, allJobTemplates]);

  const [sectionData, setSectionData] = useState<SectionData[]>([
    {
      id: 'section1',
      code: 10,
      title: 'PRE-CONSTRUCTION',
      data: [
        { id: 'item105', code: 5, title: 'Blueprints', isActive: false },
        { id: 'item110', code: 10, title: 'Plot Plan, Stake Out, Pinning', isActive: true },
        { id: 'item115', code: 15, title: 'Zoning Permit', isActive: true },
        { id: 'item120', code: 20, title: 'Building Permit', isActive: true },
        { id: 'item121', code: 21, title: 'Water Tap Fee', isActive: true },
        { id: 'item125', code: 25, title: 'Port-O-Let', isActive: true },
        { id: 'item130', code: 30, title: 'Temporary Electric', isActive: true },
        { id: 'item135', code: 35, title: 'Clearing', isActive: false },
        { id: 'item140', code: 40, title: 'Design Fee', isActive: false },
      ],
      isExpanded: false,
    },
    {
      id: 'section2',
      code: 20,
      title: 'SITE WORK',
      data: [
        { id: 'item205', code: 5, title: 'Foundation Excavation', isActive: true },
        { id: 'item206', code: 6, title: 'Trench Footers', isActive: true },
        { id: 'item210', code: 10, title: 'Footer Labor', isActive: true },
        { id: 'item215', code: 15, title: 'Footer Concrete', isActive: true },
        { id: 'item220', code: 20, title: 'Pump Truck - Footer', isActive: true },
        { id: 'item225', code: 25, title: 'Drain Tile Material', isActive: true },
        { id: 'item230', code: 30, title: 'Footer Gravel Material', isActive: true },
        { id: 'item235', code: 35, title: 'Footer Gravel - Slinger', isActive: true },
        { id: 'item240', code: 40, title: 'Foundation Wall Labor', isActive: true },
        { id: 'item241', code: 41, title: 'Block Material', isActive: true },
        { id: 'item242', code: 42, title: 'Block Labor', isActive: true },
        { id: 'item243', code: 43, title: 'Under Slab Insulation Material', isActive: true },
        { id: 'item245', code: 45, title: 'Foundation Wall Concrete', isActive: true },
        { id: 'item246', code: 46, title: 'Pump Truck - Wall', isActive: true },
        { id: 'item250', code: 50, title: 'Waterproof Foundation', isActive: true },
        { id: 'item255', code: 55, title: 'Gravel To Top Off Footer', isActive: true },
        { id: 'item260', code: 60, title: 'Plumbing Underground', isActive: true },
        { id: 'item265', code: 65, title: 'Backfill Foundation', isActive: true },
        { id: 'item270', code: 70, title: 'Haul Excess Dirt', isActive: true },
        { id: 'item275', code: 75, title: 'Garage/Porch/Temp Drive Gravel', isActive: true },
        { id: 'item280', code: 80, title: 'Basement & Garage Slab Labor', isActive: true },
        { id: 'item285', code: 85, title: 'Basement & Garage Slab Concrete', isActive: true },
        { id: 'item290', code: 90, title: 'Basement & Garage Slab Rebar/Plastic', isActive: true },
        { id: 'item295', code: 95, title: 'Pump Truck - Slabs', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section3',
      title: 'FRAMING & ROUGH-IN',
      code: 30,
      data: [
        { id: 'item3005', code: 5, title: 'Framing Labor', isActive: true },
        { id: 'item3010', code: 10, title: 'Framing Material', isActive: true },
        { id: 'item3015', code: 15, title: 'Truss Material', isActive: true },
        { id: 'item3020', code: 20, title: 'Framing Material Pickups', isActive: true },
        { id: 'item3025', code: 25, title: 'Dumpsters', isActive: true },
        { id: 'item3030', code: 30, title: 'Shingle Labor', isActive: true },
        { id: 'item3035', code: 35, title: 'Shingle Material', isActive: true },
        { id: 'item3040', code: 40, title: 'Metal Roof Material', isActive: true },
        { id: 'item3045', code: 45, title: 'Metal Roof Labor', isActive: true },
        { id: 'item3050', code: 50, title: 'Window Install Material & Labor', isActive: true },
        { id: 'item3055', code: 55, title: 'Front Door Material', isActive: true },
        { id: 'item3060', code: 60, title: 'Exterior Door Material', isActive: true },
        { id: 'item3065', code: 65, title: 'Exterior Door Labor', isActive: true },
        { id: 'item3070', code: 70, title: 'HVAC Rough', isActive: true },
        { id: 'item3075', code: 75, title: 'Fireplace Install', isActive: true },
        { id: 'item3080', code: 80, title: 'Plumbing Rough', isActive: true },
        { id: 'item3085', code: 85, title: 'Sewer & Water Tap Fee', isActive: true },
        { id: 'item3090', code: 90, title: 'Sewer & Water Install', isActive: true },
        { id: 'item3095', code: 95, title: 'Sewer/Water Gravel Material', isActive: true },
        { id: 'item3100', code: 100, title: 'Electric Trench & Sump Line', isActive: true },
        { id: 'item3105', code: 105, title: 'Frame Punch Material', isActive: true },
        { id: 'item3110', code: 110, title: 'Electric Rough', isActive: true },
        { id: 'item3115', code: 115, title: 'Low Voltage Rough', isActive: true },
        { id: 'item3120', code: 120, title: 'AIP', isActive: true },
        { id: 'item3125', code: 125, title: 'Insulation', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section4',
      title: 'EXTERIOR',
      code: 40,
      data: [
        { id: 'item4005', code: 5, title: 'Exterior Trim Labor', isActive: true },
        { id: 'item4010', code: 10, title: 'Exterior Trim Material', isActive: true },
        { id: 'item4015', code: 15, title: 'Paint Exterior Labor', isActive: true },
        { id: 'item4020', code: 20, title: 'Paint Exterior Material', isActive: true },
        { id: 'item4025', code: 25, title: 'Install Garage Doors', isActive: true },
        { id: 'item4030', code: 30, title: 'Garage Door Opener Material', isActive: true },
        { id: 'item4035', code: 35, title: 'Garage Door Opener Labor', isActive: true },
        { id: 'item4040', code: 40, title: 'Install Brick Flashing', isActive: true },
        { id: 'item4045', code: 45, title: 'Brick Labor', isActive: true },
        { id: 'item4050', code: 50, title: 'Brick Material', isActive: true },
        { id: 'item4055', code: 55, title: 'Stone Labor', isActive: true },
        { id: 'item4060', code: 60, title: 'Stone Labor', isActive: true },
        { id: 'item4065', code: 65, title: 'Clean Brick', isActive: true },
        { id: 'item4070', code: 70, title: 'Deck Labor', isActive: true },
        { id: 'item4075', code: 75, title: 'Deck Material', isActive: true },
        { id: 'item4080', code: 80, title: 'Deck Rails', isActive: true },
        { id: 'item4085', code: 85, title: 'Gutters', isActive: true },
        { id: 'item4090', code: 90, title: 'Exterior Concrete Labor', isActive: true },
        { id: 'item4095', code: 95, title: 'Exterior Concrete Gravel', isActive: true },
        { id: 'item4100', code: 100, title: 'Exterior Concrete', isActive: true },
        { id: 'item4105', code: 105, title: 'Exterior Concrete Rebar', isActive: true },
        { id: 'item4110', code: 110, title: 'Boulder Labor', isActive: true },
        { id: 'item4115', code: 115, title: 'Boulders Material', isActive: true },
        { id: 'item4120', code: 120, title: 'Final Grade', isActive: true },
        { id: 'item4125', code: 125, title: 'Install Landscaping', isActive: true },
        { id: 'item4130', code: 130, title: 'Install Irrigation System', isActive: true },
        { id: 'item4135', code: 135, title: 'Install Landscape Lighting', isActive: true },
        { id: 'item4140', code: 140, title: 'Install Sod', isActive: true },
        { id: 'item4145', code: 145, title: 'Install Fence', isActive: true },
        { id: 'item4150', code: 150, title: 'Mailbox', isActive: true },
        { id: 'item4155', code: 155, title: 'Install Phantom Screens', isActive: true },
        { id: 'item4160', code: 160, title: 'Pressure Wash Exterior Concrete', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section5',
      title: 'INTERIOR INSTALL',
      code: 50,
      data: [
        { id: 'item5005', code: 5, title: 'Drywall Material', isActive: true },
        { id: 'item5010', code: 10, title: 'Hang Drywall Labor', isActive: true },
        { id: 'item5015', code: 15, title: 'Finish Drywall Labor', isActive: true },
        { id: 'item5020', code: 20, title: 'Prime Walls Labor', isActive: true },
        { id: 'item5025', code: 25, title: 'Prime Walls Material', isActive: true },
        { id: 'item5030', code: 30, title: 'Attic Blow', isActive: true },
        { id: 'item5035', code: 35, title: 'Master Shower Tile Labor', isActive: true },
        { id: 'item5040', code: 40, title: 'Master Shower Tile Material', isActive: true },
        { id: 'item5045', code: 45, title: 'Guest Showers Tile Labor', isActive: true },
        { id: 'item5050', code: 50, title: 'Guest Shower Tile Material', isActive: true },
        { id: 'item5055', code: 55, title: 'Tile Floors Labor', isActive: true },
        { id: 'item5060', code: 60, title: 'Tile Floors Material', isActive: true },
        { id: 'item5065', code: 65, title: 'Shower Doors', isActive: true },
        { id: 'item5070', code: 70, title: 'Interior Trim Labor', isActive: true },
        { id: 'item5075', code: 75, title: 'Interior Trim/Doors Material', isActive: true },
        { id: 'item5080', code: 80, title: 'Vanity Material', isActive: true },
        { id: 'item5085', code: 85, title: 'Cabinet Material', isActive: true },
        { id: 'item5090', code: 90, title: "Interior Trim Extra's Material", isActive: true },
        { id: 'item5095', code: 95, title: 'Interior Rails', isActive: true },
        { id: 'item5100', code: 100, title: 'HVAC Final', isActive: true },
        { id: 'item5105', code: 105, title: 'Electric Final', isActive: true },
        { id: 'item5110', code: 110, title: 'Electric Final Materials', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section6',
      title: 'INTERIOR FINAL',
      code: 60,
      data: [
        { id: 'item6005', code: 5, title: 'Spray Interior Trim/Doors Labor', isActive: true },
        { id: 'item6010', code: 10, title: 'Spray Interior Trim/Doors Material', isActive: true },
        { id: 'item6015', code: 15, title: 'Drywall Touch Up', isActive: true },
        { id: 'item6020', code: 20, title: 'Roll Walls Labor', isActive: true },
        { id: 'item6025', code: 25, title: 'Roll Walls Material', isActive: true },
        { id: 'item6030', code: 30, title: 'Flooring Labor', isActive: true },
        { id: 'item6035', code: 35, title: 'Flooring Material', isActive: true },
        { id: 'item6040', code: 40, title: 'Countertops', isActive: true },
        { id: 'item6045', code: 45, title: 'Interior Trim Final Labor', isActive: true },
        { id: 'item6050', code: 50, title: 'Interior Trim Final Materials', isActive: true },
        { id: 'item6055', code: 55, title: 'Cabinet Hardware', isActive: true },
        { id: 'item6060', code: 60, title: 'Backsplash Labor', isActive: true },
        { id: 'item6065', code: 65, title: 'Backsplash Material', isActive: true },
        { id: 'item6070', code: 70, title: 'Plumbing Final', isActive: true },
        { id: 'item6075', code: 75, title: 'Plumbing Final Material', isActive: true },
        { id: 'item6080', code: 80, title: 'Mirrors', isActive: true },
        { id: 'item6085', code: 85, title: 'Shelves', isActive: true },
        { id: 'item6090', code: 90, title: 'Basement Drape Insulation', isActive: true },
        { id: 'item6095', code: 95, title: 'Carpet Prep Labor', isActive: true },
        { id: 'item6100', code: 100, title: 'Carpet Install', isActive: true },
        { id: 'item6105', code: 105, title: 'Carpet Material', isActive: true },
        { id: 'item6110', code: 110, title: 'Appliances', isActive: true },
        { id: 'item6115', code: 115, title: 'Initial Construction Clean', isActive: true },
        { id: 'item6120', code: 120, title: 'Punchout Labor', isActive: true },
        { id: 'item6125', code: 125, title: 'Punchout Materials', isActive: true },
        { id: 'item6130', code: 130, title: 'Pressure Wash Basement', isActive: true },
        { id: 'item6135', code: 135, title: 'Final Construction Clean', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section7',
      code: 7,
      title: 'OVERHEAD',
      data: [
        { id: 'item7005', code: 5, title: 'Tools', isActive: true },
        { id: 'item7010', code: 10, title: 'Service', isActive: true },
      ],
      isExpanded: false,
    },
    {
      id: 'section8',
      code: 8,
      title: 'INCOME',
      data: [
        { id: 'item8005', code: 5, title: 'Bank Draw', isActive: true },
        { id: 'item8010', code: 10, title: 'Change Order', isActive: true },
      ],
      isExpanded: false,
    },
  ]);

  const toggleSection = (id: string) => {
    setSectionData((prevData) =>
      prevData.map((section) =>
        section.id === id
          ? { ...section, isExpanded: !section.isExpanded }
          : { ...section, isExpanded: false },
      ),
    );
  };

  const toggleAllItemsActiveState = (sectionId: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.id === sectionId) {
          const allActive = section.data.every((item) => item.isActive);
          const updatedData = section.data.map((item) => ({
            ...item,
            isActive: !allActive,
          }));
          return { ...section, data: updatedData };
        }
        return section;
      }),
    );
  };

  const toggleItemActiveState = (sectionId: string, itemId: string) => {
    setSectionData((prevData) =>
      prevData.map((section) => {
        if (section.id === sectionId) {
          const updatedData = section.data.map((item) =>
            item.id === itemId ? { ...item, isActive: !item.isActive } : item,
          );
          return { ...section, data: updatedData };
        }
        return section;
      }),
    );
  };

  const marginBottom = Platform.OS === 'android' ? 20 : 0; // google pixels would prefer a value of 45

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Define Template Work Items',
        }}
      />
      <View style={[styles.container, { marginBottom }]}>
        <View style={{ alignItems: 'center', paddingVertical: 5 }}>
          <Text txtSize="title" text={template?.Name} />
        </View>
        <SectionList
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          sections={sectionData}
          renderItem={({ item, section }) =>
            section.isExpanded
              ? renderItem(item, section.id, section.code, toggleItemActiveState, colors)
              : null
          }
          renderSectionHeader={({ section }) =>
            renderSectionHeader(section, toggleSection, colors, toggleAllItemsActiveState)
          }
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No data available</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const renderSectionHeader = (
  section: SectionData,
  toggleSection: (id: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
  toggleAllItemsActiveState: (sectionId: string) => void,
) => {
  const activeCount = section.data.filter((item) => item.isActive).length;
  const totalCount = section.data.length;

  return (
    <View
      style={[
        styles.header,
        {
          borderColor: colors.borderColor,
          backgroundColor: colors.listBackground,
          borderBottomWidth: 1,
          alignItems: 'center',
          height: 50,
        },
      ]}
    >
      {section.isExpanded && (
        <Pressable style={{ marginRight: 20 }} onPress={() => toggleAllItemsActiveState(section.id)}>
          <View
            style={[
              styles.roundButton,
              {
                borderColor: colors.iconColor,
                borderWidth: 1,
                backgroundColor: 'transparent',
              },
            ]}
          />
        </Pressable>
      )}
      <Pressable style={{ flex: 1 }} onPress={() => toggleSection(section.id)} hitSlop={10}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.listBackground,
          }}
        >
          <Text txtSize="section-header" text={`${section.title} (${activeCount}/${totalCount})`} />
          <Ionicons
            name={section.isExpanded ? 'chevron-up-sharp' : 'chevron-down-sharp'}
            size={24}
            color={colors.iconColor}
          />
        </View>
      </Pressable>
    </View>
  );
};

const renderItem = (
  item: ItemData,
  sectionId: string,
  sectionCode: number,
  toggleItemActiveState: (sectionId: string, itemId: string) => void,
  colors: typeof Colors.light | typeof Colors.dark,
) => {
  const isActive = item.isActive;
  return (
    <Pressable
      style={[styles.item, { borderColor: colors.borderColor }]}
      onPress={() => toggleItemActiveState(sectionId, item.id)}
    >
      <View
        style={[
          styles.roundButton,
          {
            borderColor: colors.iconColor,
            borderWidth: 1,
            backgroundColor: isActive ? colors.iconColor : 'transparent',
          },
        ]}
      />
      <View style={{ marginLeft: 50 }}>
        <Text style={styles.itemText}>
          {sectionCode}.{item.code} - {item.title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 5,
    borderTopWidth: 1,
    height: 45,
  },
  item: {
    height: 45,
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
  },
  roundButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default JobTemplatesConfigurationScreen;
