import "mdui/components/collapse";
import "mdui/components/collapse-item";

import { JSX, splitProps } from "solid-js";

type Props = {
	children: JSX.Element;

	/** Specifies the currently oppened collapse item */
	value?: string | string[];
	/** Whether only one item should be active at a time */
	accordion?: boolean;
	disabled?: boolean;
}

/**
 * Collapse panels are used to group and hide complex content areas,
 * improving page organization.
 *
 * @see {https://www.mdui.org/en/docs/2/components/collapse}
 */
function Collapse(props: Props) {
	const [local, remote] = splitProps(props, ["children"]);

	return <mdui-collapse {...remote}>{local.children}</mdui-collapse>;
}

type ItemProps = {
	children: JSX.Element;

	/**
	 * ID of the current item, used for toggling this item from
	 * the @link{Collapse} component.
	 */
	value?: string;
	disabled?: boolean;
}

function CollapseItem(props: ItemProps) {
	const [local, remote] = splitProps(props, ["children"]);

	return (
		<mdui-collapse-item {...remote}>
			{local.children}
		</mdui-collapse-item>
	);
}

Collapse.Item = CollapseItem;

export { Collapse }
