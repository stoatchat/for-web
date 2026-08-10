import {
  For,
  JSXElement,
  Show,
  createEffect,
  createSignal,
  on,
} from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import MdChevronLeft from "@material-design-icons/svg/outlined/chevron_left.svg?component-solid";
import MdChevronRight from "@material-design-icons/svg/outlined/chevron_right.svg?component-solid";
import MdFirstPage from "@material-design-icons/svg/outlined/first_page.svg?component-solid";
import MdLastPage from "@material-design-icons/svg/outlined/last_page.svg?component-solid";

import { Row } from "../layout";

import { Button } from "./Button";

interface Props {
  itemCount?: number;
  header?: JSXElement;
  columns: JSXElement[];
  children: (page: number, itemsPerPage: number) => JSXElement;
}

/**
 * Data tables display sets of data across rows and columns
 *
 * This component is not present in Material 3 thus has been inspired by the following implementations:
 * - https://m2.material.io/design/components/data-tables.html
 * - https://material-web-additions.maicol07.it/components/data-table/
 */
export function DataTable(props: Props) {
  const [page, setPage] = createSignal(0);
  const [itemsPerPage, setItemsPerPage] = createSignal(0);

  createEffect(
    on(
      () => props.itemCount,
      (itemCount) =>
        setItemsPerPage((count) => (count ? count : itemCount ? 12 : 0)),
    ),
  );

  const lastPage = () =>
    props.itemCount
      ? Math.max(0, Math.floor(props.itemCount / itemsPerPage() - 1))
      : 0;

  return (
    <Container>
      <Table>
        <Head>
          <Show when={props.header}>
            <tr>
              <Header colspan={props.columns.length}>{props.header}</Header>
            </tr>
          </Show>
          <tr>
            <For each={props.columns}>{(header) => <Cell>{header}</Cell>}</For>
          </tr>
        </Head>
        <tbody>
          {props.children(page(), itemsPerPage())}
          <Show when={props.itemCount}>
            <TableRow>
              <Cell colspan={props.columns.length}>
                <Pagination>
                  {/* <Row align>
                    <Trans>Rows per page:</Trans>
                    <TextField.Select
                      value="12"
                      variant="outlined"
                      class={css({ width: "80px" })}
                      onChange={(e) =>
                        setItemsPerPage(parseInt(e.currentTarget.value))
                      }
                    >
                      <MenuItem value="12">12</MenuItem>
                      <MenuItem value="25">25</MenuItem>
                      <MenuItem value="50">50</MenuItem>
                      <MenuItem value="100">100</MenuItem>
                    </TextField.Select>
                  </Row> */}

                  <Trans>
                    {page() * itemsPerPage() + 1}-
                    {Math.min(
                      props.itemCount!,
                      page() * itemsPerPage() + itemsPerPage(),
                    )}{" "}
                    of {props.itemCount}
                  </Trans>

                  <Row>
                    <Button
                      shape="round"
                      isDisabled={page() === 0}
                      onPress={() => setPage(0)}
                    >
                      <MdFirstPage />
                    </Button>
                    <Button
                      shape="round"
                      isDisabled={page() === 0}
                      onPress={() => setPage((page) => page - 1)}
                    >
                      <MdChevronLeft />
                    </Button>
                    <Button
                      shape="round"
                      isDisabled={page() === lastPage()}
                      onPress={() => setPage((page) => page + 1)}
                    >
                      <MdChevronRight />
                    </Button>
                    <Button
                      shape="round"
                      isDisabled={page() === lastPage()}
                      onPress={() => setPage(lastPage())}
                    >
                      <MdLastPage />
                    </Button>
                  </Row>
                </Pagination>
              </Cell>
            </TableRow>
          </Show>
        </tbody>
      </Table>
    </Container>
  );
}

const Container = styled("div", {
  base: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
  },
});

const Table = styled("table", {
  base: {
    width: "100%",
    // margin: "var(--gap-md)",
  },
});

const Header = styled("td", {
  base: {
    padding: "var(--gap-lg)",
  },
});

const Head = styled("thead", {
  base: {
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const TableRow = styled("tr", {
  base: {
    borderBlock: "1px solid var(--md-sys-color-outline-variant)",
  },
});

const Cell = styled("td", {
  base: {
    padding: "var(--gap-lg)",
  },
});

const Pagination = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
    justifyContent: "end",
  },
});

DataTable.Row = TableRow;
DataTable.Cell = Cell;
