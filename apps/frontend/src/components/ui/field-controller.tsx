"use client"

import {
	type Control,
	Controller,
	type ControllerFieldState,
	type ControllerRenderProps,
	type FieldValues,
	type Path,
	type UseFormStateReturn,
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

export type FlatFieldProps<
	T extends FieldValues,
	P extends Path<T>,
> = ControllerRenderProps<T, P> & {
	id: string;
	"aria-invalid": boolean;
};

interface FieldControllerProps<
	T extends FieldValues,
	P extends Path<T> = Path<T>,
> {
	control: Control<T>;
	name: P;
	label?: string | React.ReactNode;
	description?: string | React.ReactNode;
	className?: string;
	orientation?: "vertical" | "horizontal";
	render: (
		props: FlatFieldProps<T, P>,
		meta: {
			fieldState: ControllerFieldState;
			formState: UseFormStateReturn<T>;
		},
	) => React.ReactNode;
}

/** Better Field component for react-hook-form
 *
 * use behind <FieldGroup>
 */
export function FieldController<
	T extends FieldValues,
	P extends Path<T> = Path<T>,
>({
	control,
	name,
	label,
	description,
	className,
	orientation = "vertical",
	render,
}: FieldControllerProps<T, P>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState, formState }) => {
				const flatProps: FlatFieldProps<T, P> = {
					...field,
					id: field.name,
					"aria-invalid": !!fieldState.invalid,
				};
				return (
					<Field
						data-invalid={fieldState.invalid}
						className={className}
						orientation={orientation}
					>
						{label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
						{render(flatProps, { fieldState, formState })}
						{description && <FieldDescription>{description}</FieldDescription>}
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				);
			}}
		/>
	);
}
