import { Input } from "@/components/ui/input";

export interface InputNumberProps
	extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
	onChange?: (value: number | undefined) => void;
}
export function InputNumber({ onChange, ...props }: InputNumberProps) {
	return (
		<Input
			{...props}
			type="number"
			onChange={(e) => {
				const value = e.target.value;
				// Ahora TS es feliz porque espera exactamente esto
				onChange?.(value === "" ? undefined : Number(value));
			}}
		/>
	);
}

// export function CustomInput() {
// 	const form = useForm<{
// 		amount: number;
// 		title: string;
// 	}>();

// 	return (
// 		<>
// 			<FieldController
// 				control={form.control}
// 				name="amount"
// 				label="Monto"
// 				render={InputNumber}
// 			/>

// 			<FieldController
// 				control={form.control}
// 				name="title"
// 				label="Título Especial"
// 				render={(props, { fieldState }) => (
// 					<div className="relative">
// 						<Input {...props} />
// 						{fieldState.isDirty && (
// 							<span className="absolute right-0">Editado</span>
// 						)}
// 					</div>
// 				)}
// 			/>
// 		</>
// 	);
// }
