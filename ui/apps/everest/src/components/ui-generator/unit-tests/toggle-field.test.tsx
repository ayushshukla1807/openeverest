// Copyright (C) 2026 The OpenEverest Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { TestWrapper } from 'utils/test';
import { UIGenerator } from '../ui-generator';
import {
  Component,
  FieldType,
  ToggleFieldParams,
  CommonValidation,
  TopologyUISchemas,
} from '../ui-generator.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildZodSchema } from '../utils/schema-builder';
import { getDefaultValues } from '../utils/default-values';
import { Button } from '@mui/material';

vi.mock('../utils/cel-validation', () => ({
  extractCelFieldPaths: vi.fn(() => []),
  validateCelExpression: vi.fn(() => true),
}));

vi.mock('../utils/schema-builder/cel-validation', () => ({
  extractCelFieldPaths: vi.fn(() => []),
  validateCelExpression: vi.fn(() => true),
}));

const createTestSchema = (
  fieldParams: Partial<ToggleFieldParams> = {},
  validation?: CommonValidation
): TopologyUISchemas => {
  const testToggle: Extract<Component, { uiType: FieldType.Toggle }> = {
    uiType: FieldType.Toggle,
    path: 'spec.testToggle',
    fieldParams: {
      label: 'Test Toggle Field',
      ...fieldParams,
    },
  };

  if (validation) {
    testToggle.validation = validation;
  }

  return {
    testTopology: {
      sections: {
        basicInfo: {
          label: 'Basic Information',
          components: { testToggle },
        },
      },
      sectionsOrder: ['basicInfo'],
    },
  };
};

interface FormWrapperProps {
  children: React.ReactNode;
  schema: TopologyUISchemas;
  onSubmit: (data: Record<string, unknown>) => void;
}

const FormWrapper = ({ children, schema, onSubmit }: FormWrapperProps) => {
  const { schema: zodSchema } = buildZodSchema(schema, 'testTopology');
  const defaultValues = getDefaultValues(schema, 'testTopology');

  const methods = useForm({
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
    defaultValues,
    reValidateMode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
        <Button
          type="submit"
          disabled={!methods.formState.isValid}
          data-testid="submit-button"
        >
          Submit
        </Button>
      </form>
    </FormProvider>
  );
};

describe('UIGenerator - Toggle Field Basic Rendering', () => {
  it('should render a toggle input with correct label', async () => {
    const schema = createTestSchema({});

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={vi.fn()}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    expect(screen.getByLabelText('Test Toggle Field')).toBeInTheDocument();
  });

  it('should have a data-testid derived from the field path', () => {
    const schema = createTestSchema({});

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={vi.fn()}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    expect(screen.getByTestId('switch-input-spec.test-toggle')).toBeInTheDocument();
  });

  it('should render disabled state', () => {
    const schema = createTestSchema({ disabled: true });

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={vi.fn()}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    expect(screen.getByLabelText('Test Toggle Field')).toBeDisabled();
  });

  it('should render helperText when provided', () => {
    const schema = createTestSchema({ helperText: 'Some helper text' });

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={vi.fn()}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    expect(screen.getByText('Some helper text')).toBeInTheDocument();
  });

  it('should render labelCaption when provided', () => {
    const schema = createTestSchema({ labelCaption: 'Some caption' });

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={vi.fn()}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    expect(screen.getByText('Some caption')).toBeInTheDocument();
  });
});

describe('UIGenerator - Toggle Field Interaction', () => {
  it('should change value when clicked', async () => {
    const onSubmit = vi.fn();
    const schema = createTestSchema({ defaultValue: false });

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={onSubmit}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    const toggle = screen.getByLabelText('Test Toggle Field');
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.spec?.testToggle).toBe(true);
    });
  });

  it('should support default value true', async () => {
    const onSubmit = vi.fn();
    const schema = createTestSchema({ defaultValue: true });

    render(
      <TestWrapper>
        <FormWrapper schema={schema} onSubmit={onSubmit}>
          <UIGenerator
            sections={schema.testTopology!.sections}
            sectionKey="basicInfo"
          />
        </FormWrapper>
      </TestWrapper>
    );

    const toggle = screen.getByLabelText('Test Toggle Field');
    expect(toggle).toBeChecked();

    fireEvent.submit(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.spec?.testToggle).toBe(true);
    });
  });
});
