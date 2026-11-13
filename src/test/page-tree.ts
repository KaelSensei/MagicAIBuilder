/**
 * Reads what a server page hands one of its components, without rendering.
 *
 * Why: a page test that pins the values a page passes to its view may not
 * replace the view with an echo (ADR 0005, rule 5: no mock of a repository
 * module), and rendering the real view drags in the app shell, the router and
 * the session provider, none of which the page's contract depends on. An async
 * server page returns a React element tree; {@link propsHandedTo} walks it and
 * returns the props of the first element of the given component. The view's
 * own rendering is pinned by its component tests.
 *
 * ```ts
 * const tree = await UserProfilePage({ params });
 * const props = propsHandedTo(tree, PublicProfileView);
 * expect(props?.profile.isFollowing).toBe(false);
 * ```
 *
 * @module test/page-tree
 */
import {
  isValidElement,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from "react";

/** Arrays and other iterables of nodes, which a tree may hold as children. */
function isNodeList(node: ReactNode): node is Iterable<ReactNode> {
  return typeof node === "object" && node !== null && Symbol.iterator in node;
}

/**
 * The props of the first `component` element in `tree`, depth first, or null
 * when the page does not render it.
 *
 * Only elements are walked: a lazy or promised child is not awaited, so a
 * component rendered by a nested async component is not found.
 *
 * @param tree - what the page returned
 * @param component - the component whose props to read, by reference
 * @returns its props as the page wrote them, or null
 */
export function propsHandedTo<P>(
  tree: ReactNode,
  component: ComponentType<P>
): P | null {
  if (isNodeList(tree)) {
    for (const child of tree) {
      const found = propsHandedTo(child, component);
      if (found !== null) return found;
    }
    return null;
  }
  if (!isValidElement(tree)) return null;
  if (tree.type === component && isValidElement<P>(tree)) return tree.props;
  return isValidElement<PropsWithChildren>(tree)
    ? propsHandedTo(tree.props.children, component)
    : null;
}
