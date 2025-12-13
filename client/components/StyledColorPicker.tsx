import ColorPicker, {
    Panel1,
    HueSlider,
    Preview,
} from "reanimated-color-picker";

export function StyledColorPicker({
    onChange,
    value,
}: {
    value: string;
    onChange: (hex: string) => void;
}) {
    return (
        <ColorPicker
            value={value}
            onComplete={(color) => {
                onChange(color.hex);
            }}
            style={{ width: "100%" }}>
            <Preview />
            <Panel1 />
            <HueSlider />
        </ColorPicker>
    );
}

export default StyledColorPicker;
