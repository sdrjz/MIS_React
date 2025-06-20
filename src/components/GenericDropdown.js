import React, { useState } from 'react';
import Select, { components } from 'react-select';

const SELECT_ALL_VALUE = 'ALL';

const CheckboxOption = (props) => {
  const { data, options, selectProps, isSelected } = props;
  const isSelectAll = data.value === SELECT_ALL_VALUE;
  const actualOptions = options.filter(o => o.value !== SELECT_ALL_VALUE);
  const isAllSelected = selectProps.value.length === actualOptions.length;
  const checked = isSelectAll ? isAllSelected : isSelected;

  return (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => null}
        style={{ marginRight: 8 }}
      />
      <label style={{ fontSize: '14px' }}>{data.label}</label>
    </components.Option>
  );
};

const GenericDropdown = ({ dropdownOptions = [], placeholder, onChange }) => {
const [selectedOptions, setSelectedOptions] = useState([]);

  const selectAllOption = { value: SELECT_ALL_VALUE, label: 'Select All' };

  const handleChange = (selected) => {
    if (!selected) {
      setSelectedOptions([]);
      onChange([]);
      return;
    }

    const isSelectAllClicked = selected.some(opt => opt.value === SELECT_ALL_VALUE);
    const isAllCurrentlySelected = selectedOptions.length === dropdownOptions.length;

    if (isSelectAllClicked && !isAllCurrentlySelected) {
      setSelectedOptions(dropdownOptions);
      onChange(dropdownOptions.map(opt => opt.value));
    } else if (isSelectAllClicked && isAllCurrentlySelected) {
      setSelectedOptions([]);
      onChange([]);
    } else {
      const filtered = selected.filter(opt => opt.value !== SELECT_ALL_VALUE);
      setSelectedOptions(filtered);
      onChange(filtered.map(opt => opt.value));
    }
  };

  const getSelectedValues = () => {
    const isAllSelected =
      selectedOptions.length === dropdownOptions.length && dropdownOptions.length > 0;
    return isAllSelected ? dropdownOptions : selectedOptions;
  };

  const selected = selectedOptions;
  const allSelected =
    selected.length === dropdownOptions.length && dropdownOptions.length > 0;

  let dynamicPlaceholder = placeholder;
  if (selected.length > 0 && !allSelected) {
    dynamicPlaceholder = `${placeholder} (${selected.length} selected)`;
  } else if (allSelected) {
    dynamicPlaceholder = `${placeholder} (All selected)`;
  }

  return (
    <Select
      options={[selectAllOption, ...dropdownOptions]}
      isMulti
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      isSearchable={true}
      components={{
        Option: CheckboxOption,
        MultiValue: () => null
      }}
      onChange={handleChange}
      value={getSelectedValues()}
      placeholder={dynamicPlaceholder}
      className="custom-multi-select"
      classNamePrefix="custom-select"
      filterOption={(option, inputValue) => {
        if (option.data.value === SELECT_ALL_VALUE) return true;
        return option.data.label.toLowerCase().includes(inputValue.toLowerCase());
      }}
    />
  );
};

// ✅ Second Dropdown Without Checkboxes
export const SimpleDropdown = ({ dropdownOptions = [], placeholder, onChange }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleChange = (selected) => {
    setSelectedOption(selected);
    onChange(selected || null); 
  };

  return (
    <Select
      options={dropdownOptions}
      isMulti={false}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      // className="simple-select"
      // classNamePrefix="simple-select"
      isSearchable={true}
    />
  );
};

export default GenericDropdown;
