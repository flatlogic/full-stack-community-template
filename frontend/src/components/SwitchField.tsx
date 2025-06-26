import React, { useEffect, useId, useState } from 'react';
import Switch from "react-switch";

export const SwitchField = ({
                        field,
                        form,
                        disabled
                                }) => {
    const handleChange = (data: any) => {
        form.setFieldValue(
            field.name,
            data,
        );
    };

    return (
        <Switch checkedIcon={false} uncheckedIcon={false} className={'check'} onChange={handleChange} checked={!!field?.value} disabled={disabled} />
    );
};
