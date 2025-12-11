import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useState } from "react";
import { Alert } from "react-native";
import StyledDropdown from "./StyledDropdown";
import StyledModal from "./StyledModal";

export const SwitchBandModal = ({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) => {
    const { bands, activeBand, switchBand } = useBand();
    const fontSize = useAccessibleFontSize();

    const [openSwitch, setOpenSwitch] = useState(false);
    const [valueSwitch, setValueSwitch] = useState("");
    const [itemsSwitch, setItemsSwitch] = useState<any[]>(
        bands.map((band) => ({
            label: band.name,
            value: band.id,
        })) || []
    );
    const handleBandSwitch = (bandId: string | null) => {
        if (!bandId || bandId === activeBand?.id) {
            return;
        }

        const switchedBand = switchBand(bandId);
        setOpenSwitch(false);
        if (switchedBand) {
            Alert.alert("Success", "Band switched to " + switchedBand.name);
        }
        onClose();
    };
    return (
        <StyledModal
            title='Switch band context'
            subtitle='If you are a part of more bands, you can switch between them here'
            onClose={onClose}
            visible={visible}
        >
            <StyledDropdown
                items={itemsSwitch}
                value={valueSwitch}
                setValue={setValueSwitch}
                open={openSwitch}
                setOpen={setOpenSwitch}
                multiple={false}
                onChangeValue={handleBandSwitch}
                style={{ marginTop: 12 }}
            />
        </StyledModal>
    );
};
