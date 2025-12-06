import { ActionButton } from '@/src/components/ActionButton';
import { Text, View } from '@/src/components/Themed';
import { useActiveProjectIds } from '@/src/context/ActiveProjectIdsContext';
import { useColors } from '@/src/context/ColorsContext';
import { FlatList } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  InvoiceData,
  RecentInvoiceDateCompare,
  useAddRowCallback,
  useAllRows,
  useCostUpdater,
  useIsStoreAvailableCallback,
  useSeedWorkItemsIfNecessary,
  ClassifiedInvoiceData,
} from '@/src/tbStores/projectDetails/ProjectDetailsStoreHooks';
import { useAllRows as useAllRowsConfiguration } from '@/src/tbStores/configurationStore/ConfigurationStoreHooks';
import { useAddImageCallback } from '@/src/utils/images';
import { createThumbnail } from '@/src/utils/thumbnailUtils';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableInvoiceItem from '@/src/components/SwipeableInvoiceItem';

const ProjectInvoicesPage = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    invoiceId: string;
    projectName: string;
  }>();

  const [projectIsReady, setProjectIsReady] = useState(false);
  const isStoreReady = useIsStoreAvailableCallback(projectId);
  const { addActiveProjectIds, activeProjectIds } = useActiveProjectIds();

  useEffect(() => {
    if (projectId) {
      addActiveProjectIds([projectId]);
    }
  }, [projectId, addActiveProjectIds]);

  useEffect(() => {
    setProjectIsReady(!!projectId && activeProjectIds.includes(projectId) && isStoreReady());
  }, [projectId, activeProjectIds, isStoreReady]);
  useSeedWorkItemsIfNecessary(projectId);

  const auth = useAuth();
  const allInvoices = useAllRows(projectId, 'invoices', RecentInvoiceDateCompare);
  const allCostItems = useAllRows(projectId, 'workItemCostEntries');
  const addInvoiceImage = useAddImageCallback();
  const addInvoice = useAddRowCallback(projectId, 'invoices');
  const allWorkItems = useAllRowsConfiguration('workItems');
  const listRef = useRef<any>(null);
  const previousInvoiceCount = useRef(0);

  useCostUpdater(projectId);

  // return ClassifiedInvoiceData array using allInvoices where fullyClassified is true if
  // all cost items for this invoice have a valid work item id
  const classifiedInvoices: ClassifiedInvoiceData[] = useMemo(() => {
    return allInvoices.map((invoice) => {
      // get all cost items for this invoice
      const invoiceCostItems = allCostItems.filter((item) => item.parentId === invoice.id);
      // check if all cost items have a valid work item id
      const fullyClassified =
        invoiceCostItems.length > 0 &&
        invoiceCostItems.every(
          (item) =>
            item.workItemId &&
            item.workItemId.length > 0 &&
            allWorkItems.find((wi) => wi.id === item.workItemId) !== undefined,
        );

      return {
        ...invoice,
        fullyClassified,
      };
    });
  }, [allInvoices, allCostItems, allWorkItems]);

  const colors = useColors();

  const handleAddPhotoInvoice = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const cameraResponse = await ImagePicker.launchCameraAsync({ quality: 0.25 });

    if (!cameraResponse.canceled) {
      const asset = cameraResponse.assets[0];
      if (!cameraResponse.assets || cameraResponse.assets.length === 0 || !asset) return;

      // TODO: Add deviceTypes as the last parameter. Separated by comma's. i.e. "tablet, desktop, phone".
      const imageAddResult = await addInvoiceImage(asset.uri, projectId, 'photo', 'invoice');
      if (imageAddResult.status !== 'Success') {
        alert(`Unable to add invoice image: ${JSON.stringify(imageAddResult)}`);
        return;
      }

      console.log('Finished adding Invoice Image.', imageAddResult.id);
      const thumbnail = await createThumbnail(asset.uri);

      const newInvoice: InvoiceData = {
        id: '',
        vendor: '',
        description: '',
        amount: 0,
        numLineItems: 0,
        thumbnail: thumbnail ?? '',
        invoiceDate: new Date().getTime(),
        notes: '',
        markedComplete: false,
        imageId: imageAddResult.id,
        pictureDate: new Date().getTime(),
        invoiceNumber: '',
      };

      console.log('Adding a new Invoice.', newInvoice);

      const response = addInvoice(newInvoice);
      if (response?.status === 'Success') {
        newInvoice.id = response.id;
        console.log('Project invoice successfully added:', newInvoice);
      } else {
        alert(
          `Unable to insert Project invoice: ${JSON.stringify(newInvoice.imageId)} - ${JSON.stringify(
            response,
          )}`,
        );
      }
    }
  }, [projectId, addInvoiceImage, addInvoice, projectName]);

  const handleAddInvoice = useCallback(() => {
    router.push({
      pathname: '/[projectId]/invoice/add',
      params: {
        projectId,
        projectName,
      },
    });
  }, [projectId, projectName, router]);

  // Scroll to top when new invoices are added
  useEffect(() => {
    if (classifiedInvoices.length > previousInvoiceCount.current && previousInvoiceCount.current > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    previousInvoiceCount.current = classifiedInvoices.length;
  }, [classifiedInvoices.length]);

  return (
    <SafeAreaView edges={['right', 'bottom', 'left']} style={styles.container}>
      <Stack.Screen options={{ title: `${projectName}`, headerShown: true }} />
      <View style={styles.viewCenteringContainer}>
        {!projectIsReady ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <View style={styles.viewContentContainer}>
              <View
                style={{
                  backgroundColor: colors.listBackground,
                  padding: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    padding: 5,
                    borderRadius: 5,
                    gap: 10,
                  }}
                >
                  <ActionButton
                    style={{ flex: 1 }}
                    onPress={handleAddPhotoInvoice}
                    type={'action'}
                    title="Add Photo"
                  />
                  <ActionButton
                    style={{ flex: 1 }}
                    onPress={handleAddInvoice}
                    type={'action'}
                    title="Add Manual"
                  />
                </View>
              </View>
              <View
                style={{
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text txtSize="title" style={{ marginVertical: 5 }}>
                  Project Invoices
                </Text>
              </View>

              {allInvoices.length === 0 ? (
                <View style={{ alignItems: 'center', margin: 40 }}>
                  <Text txtSize="xl" text="No invoices found." />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      width: '100%',
                      backgroundColor: colors.listBackground,
                    }}
                  >
                    <FlatList
                      ref={listRef}
                      data={classifiedInvoices}
                      keyExtractor={(item, index) => item.id ?? index.toString()}
                      renderItem={({ item }) => (
                        <SwipeableInvoiceItem orgId={auth.orgId!!} projectId={projectId} item={item} />
                      )}
                    />
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewCenteringContainer: {
    flex: 1,
    alignItems: 'center',
  },
  viewContentContainer: {
    padding: 0,
    flex: 1,
    width: '100%',
    maxWidth: 550,
  },
});

export default ProjectInvoicesPage;
