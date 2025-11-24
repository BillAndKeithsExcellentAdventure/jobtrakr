# ModalScreenContainerWithList

A variant of `ModalScreenContainer` designed specifically for modal screens that contain scrollable lists (FlatList, SectionList, FlashList, etc.).

## When to Use

Use `ModalScreenContainerWithList` instead of `ModalScreenContainer` when:

- Your modal content includes scrollable lists like `FlatList`, `SectionList`, or `FlashList`
- You're experiencing scrolling issues with nested scrollable components
- You need the children to manage their own scrolling

Use the regular `ModalScreenContainer` when:

- Your modal content is primarily form fields without large scrollable lists
- The content can fit in a `KeyboardAwareScrollView`

## Key Differences

| Feature | ModalScreenContainer | ModalScreenContainerWithList |
|---------|---------------------|------------------------------|
| Keyboard Handling | KeyboardAwareScrollView | KeyboardAvoidingView |
| Best For | Forms with inputs | Forms with scrollable lists |
| Scrolling | Managed by container | Managed by children |
| Nested Lists | Can cause issues | Works well |

## Usage

```tsx
import { ModalScreenContainerWithList } from '@/src/components/ModalScreenContainerWithList';

const MyModalScreen = () => {
  const [items, setItems] = useState([...]);
  
  return (
    <View style={{ flex: 1, width: '100%' }}>
      <ModalScreenContainerWithList
        onSave={handleSave}
        onCancel={() => router.back()}
        canSave={canSave}
        saveButtonTitle="Add Selected"
      >
        <Text style={styles.modalTitle}>Select Items</Text>
        
        {/* Your scrollable list */}
        <FlatList
          data={items}
          renderItem={({ item }) => <ItemComponent item={item} />}
          keyExtractor={(item) => item.id}
        />
      </ModalScreenContainerWithList>
    </View>
  );
};
```

## Props

Same as `ModalScreenContainer`:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onSave | () => void | Yes | - | Callback when save button is pressed |
| onCancel | () => void | Yes | - | Callback when cancel button is pressed |
| canSave | boolean | No | true | Whether the save button is enabled |
| saveButtonTitle | string | No | 'Save' | Label for the save button |
| cancelButtonTitle | string | No | 'Cancel' | Label for the cancel button |
| children | ReactNode | Yes | - | Modal content (should include scrollable list) |

## Features

- ✅ Keyboard avoidance using `KeyboardAvoidingView`
- ✅ Proper safe area handling
- ✅ Consistent save/cancel button layout
- ✅ iOS keyboard toolbar support
- ✅ Works with nested scrollable components
- ✅ Platform-specific behavior (iOS padding, Android height)

## Implementation Notes

- The component uses `KeyboardAvoidingView` instead of `KeyboardAwareScrollView`
- Children are responsible for their own scrolling (include FlatList, etc.)
- Automatically handles platform differences (iOS vs Android)
- Save/cancel buttons are fixed at the bottom
- Includes proper styling for modal presentation

## Examples

### With FlatList
```tsx
<ModalScreenContainerWithList onSave={handleSave} onCancel={handleCancel} canSave={canSave}>
  <Text style={styles.modalTitle}>Add Work Items</Text>
  <FlatList
    data={items}
    renderItem={({ item }) => <Item item={item} />}
    keyExtractor={(item) => item.id}
  />
</ModalScreenContainerWithList>
```

### With SectionList
```tsx
<ModalScreenContainerWithList onSave={handleSave} onCancel={handleCancel} canSave={canSave}>
  <Text style={styles.modalTitle}>Add Cost Categories</Text>
  <SectionList
    sections={sections}
    renderItem={({ item }) => <Item item={item} />}
    renderSectionHeader={({ section }) => <Header section={section} />}
  />
</ModalScreenContainerWithList>
```
