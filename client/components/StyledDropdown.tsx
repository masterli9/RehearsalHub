import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import React from "react";
import { useColorScheme } from "react-native";
import DropDownPicker, {
    DropDownPickerProps,
} from "react-native-dropdown-picker";

type StyledDropdownProps = DropDownPickerProps<any>;

function StyledDropdown({
    style,
    textStyle,
    dropDownContainerStyle,
    theme,
    listMode,
    scrollViewProps,
    ...props
}: StyledDropdownProps) {
    const colorScheme = useColorScheme();
    const fontSize = useAccessibleFontSize();

    const isDark = colorScheme === "dark";

    const baseStyle = {
        width: "100%",
        paddingHorizontal: 12,
        paddingVertical: 0,
        backgroundColor: isDark ? "#171717" : "#FFFFFF", // darkGray / white
        borderColor: isDark ? "#262626" : "#EDEDED", // accent.dark / accent.light
        borderWidth: 1,
        borderRadius: 16, // match rounded inputs
    } as const;

    const combinedStyle = Array.isArray(style)
        ? [baseStyle, ...style]
        : [baseStyle, style];

    const baseTextStyle = {
        fontSize: fontSize.sm,
        color: isDark ? "#FFFFFF" : "#0A0A0A", // text-white / black
    } as const;

    const combinedTextStyle = Array.isArray(textStyle)
        ? [baseTextStyle, ...textStyle]
        : [baseTextStyle, textStyle];

    const baseDropDownContainerStyle = {
        width: "100%",
        backgroundColor: isDark ? "#171717" : "#FFFFFF",
        borderColor: isDark ? "#262626" : "#EDEDED",
        borderWidth: 1,
        borderRadius: 16,
    } as const;

    const combinedDropDownContainerStyle = Array.isArray(dropDownContainerStyle)
        ? [baseDropDownContainerStyle, ...dropDownContainerStyle]
        : [baseDropDownContainerStyle, dropDownContainerStyle];

    return (
        <DropDownPicker
            theme={theme ?? (isDark ? "DARK" : "LIGHT")}
            listMode={listMode ?? "SCROLLVIEW"}
            scrollViewProps={{
                nestedScrollEnabled: true,
                ...(scrollViewProps || {}),
            }}
            style={combinedStyle}
            textStyle={combinedTextStyle}
            dropDownContainerStyle={combinedDropDownContainerStyle}
            {...props}
        />
    );
}

export default StyledDropdown;
